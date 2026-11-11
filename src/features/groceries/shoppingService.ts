import { getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, limit, Timestamp, type DocumentReference } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { groceryItemDoc, groceryItemsCollection } from '../../services/firebase/paths';
import { groceryIngredientKey } from '../../shared/ingredients';

export interface GroceryItem {
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    aisle: string;
    isChecked: boolean;
    mealPlanId?: string;
    source?: 'manual' | 'generated';
    /**
     * AUD-027: a Firestore Timestamp, because firestore.rules requires
     * `data.createdAt is timestamp`. Writing an ISO string here made every
     * grocery add fail the rules -- caught by the emulator suite, invisible in
     * the diff. Absent on every item saved before this change.
     */
    createdAt?: Timestamp;
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
 * AUD-029: a safety ceiling, not a page size. A real grocery list is tens of
 * items; this exists so a runaway generator cannot turn one page load into an
 * unbounded read.
 */
export const MAX_GROCERY_ITEMS = 500;

export async function getGroceryList(userId: string): Promise<GroceryItem[]> {
    const groceryRef = groceryItemsCollection(db, userId);

    // AUD-027: this read had no order at all -- the old comment admitted the
    // decision was never made -- so the list reshuffled between reloads and
    // items appeared to move on their own while shopping.
    //
    // The sort is in memory ON PURPOSE. orderBy('createdAt') would be cheaper,
    // but Firestore SILENTLY OMITS documents missing the ordered field, and
    // every item saved before this change has no createdAt. That is exactly the
    // regression AUD-095 caused in the pantry -- rows that saved fine and then
    // rendered nowhere. getPantryItems sorts in memory for the same reason.
    const snapshot = await getDocs(query(groceryRef, limit(MAX_GROCERY_ITEMS)));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroceryItem));

    return items.sort((a, b) => {
        // Legacy items have no createdAt. Keep them together at the end in a
        // stable order rather than letting them jump around.
        const aMs = a.createdAt?.toMillis?.();
        const bMs = b.createdAt?.toMillis?.();
        if (aMs === undefined && bMs === undefined) return a.name.localeCompare(b.name);
        if (aMs === undefined) return 1;
        if (bMs === undefined) return -1;
        return aMs - bMs;
    });
}

export async function addGroceryItem(userId: string, item: Omit<GroceryItem, 'id'>): Promise<string> {
    if (consumeDevFailure('addGroceryItem')) {
        throw new Error('Injected addGroceryItem failure');
    }

    const groceryRef = groceryItemsCollection(db, userId);
    // AUD-027: without this there is nothing stable to order by.
    const docRef = await addDoc(groceryRef, { createdAt: Timestamp.now(), ...item });
    return docRef.id;
}

export async function toggleGroceryItem(userId: string, itemId: string, isChecked: boolean): Promise<void> {
    if (consumeDevFailure('toggleGroceryItem')) {
        throw new Error('Injected toggleGroceryItem failure');
    }

    const itemRef = groceryItemDoc(db, userId, itemId);
    await updateDoc(itemRef, { isChecked });
}

export async function deleteGroceryItem(userId: string, itemId: string): Promise<void> {
    if (consumeDevFailure('deleteGroceryItem')) {
        throw new Error('Injected deleteGroceryItem failure');
    }

    const itemRef = groceryItemDoc(db, userId, itemId);
    await deleteDoc(itemRef);
}

/** A refresh either replaces the entire generated list or leaves it intact. */
export async function replaceGeneratedGroceryItems(userId: string, items: Omit<GroceryItem, 'id'>[]): Promise<void> {
    if (items.length === 0) return;

    // Validate the complete replacement before reading or staging any deletion.
    for (const item of items) {
        if (typeof item.name !== 'string' || !item.name.trim() ||
            typeof item.unit !== 'string' || !item.unit.trim() ||
            !Number.isFinite(item.quantity) || item.quantity <= 0) {
            throw new Error('Invalid generated grocery item. Your grocery list has not changed.');
        }
    }

    const groceryRef = groceryItemsCollection(db, userId);
    // Retain the existing refresh scope: generated items from all weeks only.
    // Manual and legacy items without a source are never part of replacement.
    const existing = await getDocs(query(groceryRef, where('source', '==', 'generated')));
    if (existing.docs.length + items.length >= 500) {
        throw new Error('Grocery refresh is too large for one atomic batch (maximum 499 writes). Your grocery list has not changed.');
    }

    const key = (mealPlanId: string | undefined, name: string, unit: string) =>
        JSON.stringify([mealPlanId, groceryIngredientKey(name, unit)]);
    const checked = new Set(existing.docs.flatMap(snapshot => {
        const item = snapshot.data();
        return item.isChecked === true && typeof item.mealPlanId === 'string' && typeof item.name === 'string' && typeof item.unit === 'string'
            ? [key(item.mealPlanId, item.name, item.unit)] : [];
    }));
    const createdAt = Timestamp.now();
    const batch = writeBatch(db);
    existing.docs.forEach(snapshot => batch.delete(snapshot.ref));
    items.forEach(item => batch.set(doc(groceryRef), {
        ...item,
        source: 'generated',
        isChecked: checked.has(key(item.mealPlanId, item.name, item.unit)),
        createdAt,
    }));
    await batch.commit();
}

/**
 * AUD-026: Firestore caps a writeBatch at 500 operations. None of the three
 * clear functions chunked, so past 500 items commit() throws and the clear
 * fails -- silently, as far as the user can tell.
 *
 * 400 leaves headroom. One helper used by all three, so the next clear function
 * cannot forget.
 */
export const DELETE_CHUNK_SIZE = 400;

async function deleteInChunks(refs: DocumentReference[]): Promise<void> {
    for (let i = 0; i < refs.length; i += DELETE_CHUNK_SIZE) {
        const batch = writeBatch(db);
        for (const ref of refs.slice(i, i + DELETE_CHUNK_SIZE)) {
            batch.delete(ref);
        }
        await batch.commit();
    }
}

export async function clearCheckedItems(userId: string): Promise<void> {
    const groceryRef = groceryItemsCollection(db, userId);

    // AUD-025: this read the whole collection and filtered in JavaScript, so you
    // paid to read every item in order to delete a subset.
    //
    // An item with no `isChecked` is not matched, exactly as `data.isChecked`
    // being falsy did not match it. Behaviour preserved, cost removed.
    const snapshot = await getDocs(query(groceryRef, where('isChecked', '==', true)));
    await deleteInChunks(snapshot.docs.map(doc => doc.ref));
}

export async function clearGroceryList(userId: string): Promise<void> {
    // No filter -- this one really does mean everything.
    const snapshot = await getDocs(groceryItemsCollection(db, userId));
    await deleteInChunks(snapshot.docs.map(doc => doc.ref));
}

export async function clearGeneratedGroceryItems(userId: string, mealPlanId?: string): Promise<void> {
    const groceryRef = groceryItemsCollection(db, userId);

    // AUD-025: filters pushed into the query.
    //
    // An item with no `source` is not matched, exactly as the old JavaScript
    // filter did not match it. Manual items written before AUD-092 have an
    // undefined source and must survive a regenerate; that is preserved, not
    // changed.
    //
    // The two-equality form needs a composite index, declared in
    // firestore.indexes.json.
    const constraints = mealPlanId
        ? [where('source', '==', 'generated'), where('mealPlanId', '==', mealPlanId)]
        : [where('source', '==', 'generated')];

    const snapshot = await getDocs(query(groceryRef, ...constraints));
    await deleteInChunks(snapshot.docs.map(doc => doc.ref));
}
