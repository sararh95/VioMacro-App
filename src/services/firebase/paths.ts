import { collection, doc, type Firestore } from 'firebase/firestore';

const USER_ROOT = 'users';
const COLLECTIONS = {
    groceryItems: 'groceryItems',
    mealPlans: 'mealPlans',
    pantryItems: 'pantryItems',
    recipes: 'recipes',
    weightHistory: 'weightHistory',
} as const;

export function userDoc(db: Firestore, userId: string) {
    return doc(db, USER_ROOT, userId);
}

export function groceryItemsCollection(db: Firestore, userId: string) {
    return collection(db, USER_ROOT, userId, COLLECTIONS.groceryItems);
}

export function groceryItemDoc(db: Firestore, userId: string, itemId: string) {
    return doc(db, USER_ROOT, userId, COLLECTIONS.groceryItems, itemId);
}

export function mealPlansCollection(db: Firestore, userId: string) {
    return collection(db, USER_ROOT, userId, COLLECTIONS.mealPlans);
}

export function mealPlanDoc(db: Firestore, userId: string, planId: string) {
    return doc(db, USER_ROOT, userId, COLLECTIONS.mealPlans, planId);
}

export function pantryItemsCollection(db: Firestore, userId: string) {
    return collection(db, USER_ROOT, userId, COLLECTIONS.pantryItems);
}

export function pantryItemDoc(db: Firestore, userId: string, itemId: string) {
    return doc(db, USER_ROOT, userId, COLLECTIONS.pantryItems, itemId);
}

export function recipesCollection(db: Firestore, userId: string) {
    return collection(db, USER_ROOT, userId, COLLECTIONS.recipes);
}

export function recipeDoc(db: Firestore, userId: string, recipeId: string) {
    return doc(db, USER_ROOT, userId, COLLECTIONS.recipes, recipeId);
}

export function newRecipeDoc(db: Firestore, userId: string) {
    return doc(recipesCollection(db, userId));
}

export function recipeAssetStoragePath(userId: string, fileName: string, timestamp = Date.now()) {
    return `${USER_ROOT}/${userId}/${COLLECTIONS.recipes}/${timestamp}_${fileName}`;
}

export function weightHistoryCollection(db: Firestore, userId: string) {
    return collection(db, USER_ROOT, userId, COLLECTIONS.weightHistory);
}

export function dailyMetricDoc(db: Firestore, userId: string, dateId: string) {
    return doc(db, USER_ROOT, userId, COLLECTIONS.weightHistory, dateId);
}
