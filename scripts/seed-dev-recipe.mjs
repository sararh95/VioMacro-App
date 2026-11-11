#!/usr/bin/env node
/**
 * Seed ONE real recipe into a local emulator account, for hands-on testing.
 *
 *   npm run seed:recipe -- you@example.com
 *
 * This is a developer tool, not app behaviour. It is deliberately NOT the
 * seedInitialRecipes function deleted in PR-2 (AUD-037): that ran inside the
 * app and could fill a real library with demo food without being asked. This
 * only runs when you type the command, only against the emulator, and adds
 * exactly one clearly-named recipe you can edit or delete like any other.
 *
 * Safety: it refuses to start unless FIRESTORE_EMULATOR_HOST is set, so it
 * can never reach production data.
 */

import { createRequire } from 'node:module';
import { readEmulatorConfig } from './emulator-config.mjs';

const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');

// Share the same validated namespace and loopback ports as CLI/app/E2E.
const config = readEmulatorConfig();
const PROJECT_ID = config.projectId;
process.env.FIRESTORE_EMULATOR_HOST = `${config.host}:${config.ports.firestore}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${config.host}:${config.ports.auth}`;

const email = process.argv[2];
if (!email) {
    console.error('Usage: npm run seed:recipe -- you@example.com');
    console.error('Start the emulators first:  npm run emulator');
    process.exit(1);
}

// ------------------------------------------------------------- the recipe

/**
 * A real, simple recipe. Every field the Firestore rules require is present.
 *
 * createdAt matters more than it looks: getRecipes() orders by it, and
 * Firestore SILENTLY OMITS documents missing the orderBy field. A recipe
 * written without it would save fine and never appear (AUD-028).
 *
 * imageUrl is deliberately empty rather than a stock photo from a third-party
 * CDN — PR-3 removes the last of those.
 */
function buildRecipe(now) {
    return {
        title: 'Overnight Oats',
        mealType: 'breakfast',
        description: 'Stir it together at night, eat it cold in the morning. No cooking.',
        tags: ['Quick', 'Make Ahead', 'High Fibre'],
        folders: ['breakfast'],
        imageUrl: '',
        cookTime: 5,
        servings: 1,
        calories: 420,
        protein: 18,
        carbs: 58,
        fat: 12,
        isFavorite: false,
        source: 'created',
        ingredients: [
            { item: 'Rolled oats', quantity: '80', unit: 'g' },
            { item: 'Milk', quantity: '200', unit: 'ml' },
            { item: 'Greek yoghurt', quantity: '100', unit: 'g' },
            { item: 'Honey', quantity: '1', unit: 'Tbsp' },
            { item: 'Blueberries', quantity: '60', unit: 'g' },
        ],
        instructions: [
            { step: 'Put the oats, milk and yoghurt in a jar and stir until no dry oats are left.', timer: 0 },
            { step: 'Stir in the honey.', timer: 0 },
            { step: 'Cover and refrigerate overnight, at least 6 hours.', timer: 0 },
            { step: 'Top with the blueberries and eat cold.', timer: 0 },
        ],
        createdAt: now,
        updatedAt: now,
    };
}

// ------------------------------------------------------------------- run

async function main() {
    admin.initializeApp({ projectId: PROJECT_ID });
    const auth = admin.auth();
    const db = admin.firestore();

    let user;
    try {
        user = await auth.getUserByEmail(email);
    } catch {
        console.error(`No emulator account found for ${email}.`);
        console.error('Create the account in the app first, then run this again.');
        console.error('(This script never creates accounts or handles passwords.)');
        process.exit(1);
    }

    const recipesRef = db.collection('users').doc(user.uid).collection('recipes');

    const existing = await recipesRef.where('title', '==', 'Overnight Oats').limit(1).get();
    if (!existing.empty) {
        console.log(`Already there — "Overnight Oats" exists for ${email}.`);
        console.log(`  recipe id: ${existing.docs[0].id}`);
        return;
    }

    const now = admin.firestore.Timestamp.now();
    const ref = await recipesRef.add(buildRecipe(now));

    console.log(`Added "Overnight Oats" to ${email}`);
    console.log(`  uid:       ${user.uid}`);
    console.log(`  recipe id: ${ref.id}`);
    console.log('');
    console.log('Open http://localhost:5173/recipes to see it.');
}

main().catch((error) => {
    console.error('Seed failed:', error?.message ?? error);
    process.exit(1);
});
