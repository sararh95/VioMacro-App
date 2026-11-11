#!/usr/bin/env node
/**
 * One-time cleanup for AUD-120.
 *
 * Before PR-2, every pantry item was stamped with an expiry exactly seven days
 * after it was added -- rice, milk and tinned beans alike. PR-2 stopped writing
 * those, but did nothing about the ones already stored, so the harm AUD-095
 * described is still live for older items: a person may throw food away, or
 * trust something spoiled, on a date the app invented.
 *
 * Why clearing them is safe: there is no UI anywhere in the app to enter an
 * expiry date. Grep confirms the only writer of `expiresAt` was the fabricated
 * default. So every value currently stored was invented, and none can be a real
 * one the user typed.
 *
 *   npm run clean:expiry -- you@example.com          # report only
 *   npm run clean:expiry -- you@example.com --apply  # actually clear them
 *
 * Refuses to run unless both emulator hosts are local, exactly like
 * seed-dev-recipe.mjs. It never touches production.
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
const apply = process.argv.includes('--apply');

if (!email) {
    console.error('Usage: npm run clean:expiry -- you@example.com [--apply]');
    console.error('Without --apply it only reports what it would change.');
    process.exit(1);
}

async function main() {
    admin.initializeApp({ projectId: PROJECT_ID });

    let user;
    try {
        user = await admin.auth().getUserByEmail(email);
    } catch {
        console.error(`No emulator account found for ${email}.`);
        process.exit(1);
    }

    const itemsRef = admin.firestore()
        .collection('users').doc(user.uid).collection('pantryItems');
    const snapshot = await itemsRef.get();

    const affected = snapshot.docs.filter((doc) => doc.data().expiresAt);

    if (affected.length === 0) {
        console.log(`Nothing to clean — no pantry item for ${email} carries an expiry.`);
        return;
    }

    console.log(`${affected.length} pantry ${affected.length === 1 ? 'item carries' : 'items carry'} a fabricated expiry:`);
    for (const doc of affected) {
        const data = doc.data();
        console.log(`  ${data.name} — expires ${data.expiresAt}`);
    }

    if (!apply) {
        console.log('');
        console.log('Report only. Re-run with --apply to clear these dates.');
        console.log('The items themselves are kept; only the invented expiry is removed.');
        return;
    }

    // Chunked at 400: writeBatch caps at 500 operations (the AUD-026 lesson).
    for (let i = 0; i < affected.length; i += 400) {
        const batch = admin.firestore().batch();
        for (const doc of affected.slice(i, i + 400)) {
            batch.update(doc.ref, { expiresAt: admin.firestore.FieldValue.delete() });
        }
        await batch.commit();
    }

    console.log('');
    console.log(`Cleared the invented expiry from ${affected.length} ${affected.length === 1 ? 'item' : 'items'}.`);
    console.log('They now show "No expiry", which is the truth.');
}

main().catch((error) => {
    console.error('Cleanup failed:', error?.message ?? error);
    process.exit(1);
});
