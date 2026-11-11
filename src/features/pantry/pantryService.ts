import { getDocs, addDoc, updateDoc, deleteDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { pantryItemDoc, pantryItemsCollection } from '../../services/firebase/paths';

export interface PantryItem {
    id?: string;
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    expiresAt?: string;
    isLowStock: boolean;
}

export async function getPantryItems(userId: string): Promise<PantryItem[]> {
    const pantryRef = pantryItemsCollection(db, userId);

    // This used to be orderBy('expiresAt'). Firestore SILENTLY OMITS any document
    // that lacks the field named in orderBy, so once expiresAt stopped being
    // fabricated (AUD-095) every new item saved correctly and then rendered
    // nowhere, with no error anywhere. Same trap as AUD-028.
    // Fetch unordered and sort in memory, so an item without an expiry is still
    // an item.
    const snapshot = await getDocs(pantryRef);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));

    // Soonest expiry first; items with no expiry sort last.
    return items.sort((a, b) => {
        if (a.expiresAt && b.expiresAt) return a.expiresAt.localeCompare(b.expiresAt);
        if (a.expiresAt) return -1;
        if (b.expiresAt) return 1;
        return a.name.localeCompare(b.name);
    });
}

export async function addPantryItem(userId: string, item: Omit<PantryItem, 'id'>): Promise<string> {
    const pantryRef = pantryItemsCollection(db, userId);
    const docRef = await addDoc(pantryRef, item);
    return docRef.id;
}

/**
 * AUD-098: quick-add wrote one item per round trip inside a for..of loop, so ten
 * pasted lines were ten sequential writes -- and a failure partway through left
 * half the list saved with no way back.
 *
 * One batch is one network call and is atomic: either every item lands or none
 * does. Chunked at 400 because a writeBatch caps at 500 (the AUD-026 lesson);
 * each chunk is atomic in itself, which is the most Firestore offers.
 */
export const PANTRY_WRITE_CHUNK_SIZE = 400;

export async function addPantryItems(
    userId: string,
    items: Array<Omit<PantryItem, 'id'>>,
): Promise<number> {
    const pantryRef = pantryItemsCollection(db, userId);

    for (let i = 0; i < items.length; i += PANTRY_WRITE_CHUNK_SIZE) {
        const batch = writeBatch(db);
        for (const item of items.slice(i, i + PANTRY_WRITE_CHUNK_SIZE)) {
            batch.set(doc(pantryRef), item);
        }
        await batch.commit();
    }

    return items.length;
}

export async function updatePantryItem(userId: string, itemId: string, updates: Partial<PantryItem>): Promise<void> {
    const itemRef = pantryItemDoc(db, userId, itemId);
    await updateDoc(itemRef, updates);
}

export async function deletePantryItem(userId: string, itemId: string): Promise<void> {
    const itemRef = pantryItemDoc(db, userId, itemId);
    await deleteDoc(itemRef);
}
