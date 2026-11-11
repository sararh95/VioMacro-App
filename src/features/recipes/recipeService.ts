import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, limit, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase/firebase';
import { recipeAssetStoragePath, recipeDoc, recipesCollection } from '../../services/firebase/paths';
import { getDocsFromServer } from 'firebase/firestore';
import type { StorageReference } from 'firebase/storage';

export interface Ingredient {
    item: string;
    quantity: string; // "0.5", "1", "1/2"
    unit: string;
    altQuantity?: string;
    altUnit?: string;
    swaps?: string[];
    // Legacy support
    amount?: string;
}

export interface Recipe {
    id?: string;
    title: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'smoothie';
    tags: string[];
    folders: string[];
    ingredients?: Ingredient[];
    instructions?: { step: string; timer?: number }[];
    imageUrl: string;
    description?: string;
    cookTime: number;
    servings: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    isFavorite?: boolean;
    source?: 'created' | 'imported';
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    originalAssetUrl?: string; // URL of the PDF or image used for parsing
    originalAssetPath?: string; // Storage path for cleanup
    originalAssetType?: 'image' | 'pdf';
    micronutrients?: {
        vitaminA?: number;
        vitaminC?: number;
        calcium?: number;
        iron?: number;
    };
}

function consumeDevFailure(key: string): boolean {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;

    const storageKey = `viomacro:e2e:fail:${key}`;
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return false;

    if (value === 'once') {
        window.sessionStorage.removeItem(storageKey);
    }

    return value === 'once' || value === 'always';
}

/**
 * Strip `id` before writing a recipe document.
 *
 * AUD-036: the parameter types say Omit<Recipe,'id'>, but TypeScript does not
 * remove excess properties at runtime -- a caller passing a full Recipe object
 * sent `id` as a document FIELD. isValidRecipe() in firestore.rules uses
 * hasOnly() and does not list `id`, so the write was rejected and the user saw
 * a generic permission error for an otherwise valid save.
 */
function withoutId<T extends { id?: string }>(value: T): Omit<T, 'id'> {
    const copy = { ...value };
    delete copy.id;
    return copy;
}

/**
 * G-D: a page size, not a ceiling. AUD-029 stopped at 500 recipes, which
 * silently hid every older recipe from the library, search, the picker and
 * grocery lists. A library smaller than one page still costs one query, the
 * same reads as before; larger libraries are read page by page.
 */
export const RECIPE_PAGE_SIZE = 500;

export async function getRecipes(userId: string): Promise<Recipe[]> {
    const recipesRef = recipesCollection(db, userId);
    const recipes: Recipe[] = [];
    let cursor: QueryDocumentSnapshot | undefined;
    for (;;) {
        // A snapshot cursor also orders by document id, so recipes sharing a
        // createdAt are neither skipped nor repeated across pages.
        const page = cursor
            ? query(recipesRef, orderBy('createdAt', 'desc'), startAfter(cursor), limit(RECIPE_PAGE_SIZE))
            : query(recipesRef, orderBy('createdAt', 'desc'), limit(RECIPE_PAGE_SIZE));
        const snapshot = await getDocs(page);
        snapshot.docs.forEach(doc => recipes.push({ id: doc.id, ...doc.data() } as Recipe));
        if (snapshot.docs.length < RECIPE_PAGE_SIZE) return recipes;
        cursor = snapshot.docs[snapshot.docs.length - 1];
    }
}

export async function getRecipe(userId: string, recipeId: string): Promise<Recipe | null> {
    const recipeRef = recipeDoc(db, userId, recipeId);
    const snapshot = await getDoc(recipeRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Recipe;
}

export async function addRecipe(userId: string, recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (consumeDevFailure('addRecipe')) {
        throw new Error('Injected addRecipe failure');
    }

    const recipeData = withoutId(recipe as Recipe);

    const recipesRef = recipesCollection(db, userId);
    const docRef = await addDoc(recipesRef, {
        ...recipeData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updateRecipe(userId: string, recipeId: string, updates: Partial<Recipe>): Promise<void> {
    if (consumeDevFailure('updateRecipe')) {
        throw new Error('Injected updateRecipe failure');
    }

    const updateData = withoutId(updates);

    const recipeRef = recipeDoc(db, userId, recipeId);
    await updateDoc(recipeRef, {
        ...updateData,
        updatedAt: Timestamp.now()
    });
}

// G-A (AUD-033): how long a whole delete may take before the user is told.
const DELETE_CONFIRM_TIMEOUT_MS = 10_000;

/** DEV-only, one-shot e2e hook, like userService's: a slow read without a slow network. */
function consumeDevDelay(key: string): number {
    if (!import.meta.env.DEV || typeof window === 'undefined') return 0;
    const storageKey = `viomacro:e2e:delay:${key}`;
    const delay = Number.parseInt(window.sessionStorage.getItem(storageKey) ?? '', 10);
    window.sessionStorage.removeItem(storageKey);
    return Number.isFinite(delay) && delay > 0 ? delay : 0;
}

/**
 * The Storage file a stored link or path points at, if it is in this user's
 * recipe folder. `ref()` reads production links, Storage emulator links and
 * plain paths alike; the old `firebasestorage.googleapis.com` test matched only
 * the first, so no emulator test ever deleted a photo.
 */
function ownRecipeFile(userId: string, link: unknown): StorageReference | null {
    if (typeof link !== 'string' || !link) return null;
    try {
        const file = ref(storage, link);
        return file.fullPath.startsWith(`users/${userId}/recipes/`) ? file : null;
    } catch {
        return null; // a link to another website, not one of our files
    }
}

/**
 * Does a recipe other than `recipeId` still use this file? Asked of the server:
 * a cache read can miss the other recipe and wrongly answer no. If the
 * question cannot be answered, the answer is yes, so the file is kept.
 */
async function usedByAnotherRecipe(userId: string, recipeId: string, file: StorageReference, urls: string[]): Promise<boolean> {
    const filters = [
        ...urls.flatMap(url => [where('imageUrl', '==', url), where('originalAssetUrl', '==', url)]),
        where('originalAssetPath', '==', file.fullPath),
    ];
    try {
        if (consumeDevFailure('recipeFileShareCheck')) throw new Error('Injected recipe file share check failure');
        const delay = consumeDevDelay('recipeFileShareCheck');
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        const results = await Promise.all(filters.map(filter => getDocsFromServer(query(recipesCollection(db, userId), filter))));
        return results.some(result => result.docs.some(other => other.id !== recipeId));
    } catch (err) {
        console.warn('Could not check whether a recipe file is shared; keeping it:', err);
        return true;
    }
}

/**
 * Offline, reads stall and deleteDoc neither resolves nor rejects: it waits for
 * the server. So the WHOLE delete, reads and shared-file checks included, has
 * one deadline. When it passes, the caller tells the user; if the record
 * delete had not started yet, it never does, and every file is kept.
 */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
    let gaveUp = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            gaveUp = true;
            reject(new Error('The server did not confirm the recipe delete in time.'));
        }, DELETE_CONFIRM_TIMEOUT_MS);
    });
    await Promise.race([deleteRecordThenFiles(userId, recipeId, () => gaveUp), deadline]).finally(() => clearTimeout(timer));
}

async function deleteRecordThenFiles(userId: string, recipeId: string, gaveUp: () => boolean): Promise<void> {
    const recipeRef = recipeDoc(db, userId, recipeId);
    const data = (await getDoc(recipeRef)).data() ?? {};

    // 1. While the record still says which files are its own, decide which are
    //    used by no other recipe. An imported photo is also the source file.
    const files = new Map<string, { file: StorageReference; urls: string[] }>();
    for (const link of [data.imageUrl, data.originalAssetUrl, data.originalAssetPath]) {
        const file = ownRecipeFile(userId, link);
        if (!file) continue;
        const entry = files.get(file.fullPath) ?? { file, urls: [] };
        if (link !== file.fullPath && !entry.urls.includes(link)) entry.urls.push(link);
        files.set(file.fullPath, entry);
    }
    const unshared: StorageReference[] = [];
    for (const { file, urls } of files.values()) {
        if (!(await usedByAnotherRecipe(userId, recipeId, file, urls))) unshared.push(file);
    }

    // 2. If the deadline has passed, the user was already told the delete is
    //    unconfirmed. Delete nothing; the record and every file stay.
    if (gaveUp()) return;

    // 3. Delete the record first. Files deleted before it could not be brought
    //    back when the record delete then failed.
    const recordDeleted = deleteDoc(recipeRef);

    // 4. Remove the files only once the server confirms the record is gone,
    //    even if that is after the deadline. A failure here leaves an unused
    //    file behind; it never brings the recipe back.
    void recordDeleted.then(
        () => Promise.allSettled(unshared.map(file => deleteObject(file))).then(results => results.forEach(result => {
            if (result.status === 'rejected') console.warn('Recipe deleted, but one of its files was not:', result.reason);
        })),
        () => { /* the record is still there, so its files stay */ },
    );
    await recordDeleted;
}

// Upload Asset (Image or PDF)
export async function uploadRecipeAsset(userId: string, file: File): Promise<{ url: string; storagePath: string }> {
    const storagePath = recipeAssetStoragePath(userId, file.name);
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return { url, storagePath };
}

export async function deleteRecipeAsset(storagePathOrUrl: string): Promise<void> {
    if (!storagePathOrUrl) return;
    await deleteObject(ref(storage, storagePathOrUrl));
}
