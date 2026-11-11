import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, doc, getDoc, runTransaction, Timestamp, terminate } from 'firebase/firestore';
import { pathToFileURL } from 'node:url';
import { readEmulatorConfig } from './emulator-config.mjs';

/** null means no write. Never reset an existing user's saved preferences. */
export function qaSeedSettings(existing) {
  if (existing !== null) {
    if (existing?.onboardingCompleted !== true || existing?.measurementUnit !== 'imperial') {
      throw new Error('Existing QA profile is incompatible; use a fresh emulator or another explicit export. Saved settings were not changed.');
    }
    return null;
  }
  return { macroSplit: { protein: 30, carbs: 35, fat: 35 }, dailyCalorieTarget: 0, dietaryTags: [], allergies: [], measurementUnit: 'imperial', onboardingCompleted: true, phase: 'maintenance' };
}

export async function seedQaAccount() {
  // Validate project/loopback/flags before constructing a Firebase client.
  const config = readEmulatorConfig();
  const app = initializeApp(config.firebase, `qa-bootstrap-${Date.now()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${config.host}:${config.ports.auth}`, { disableWarnings: true });
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  connectFirestoreEmulator(db, config.host, config.ports.firestore);
  const email = 'test@test.com';
  const password = '123456'; // Synthetic emulator account only; never sent to a remote service.
  try {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (!['auth/user-not-found', 'auth/invalid-credential'].includes(error.code)) throw error;
      // Wrong-password existing accounts fail with email-already-in-use here;
      // no password reset, deletion or overwrite is attempted.
      credential = await createUserWithEmailAndPassword(auth, email, password);
    }
    const userRef = doc(db, 'users', credential.user.uid);
    let createdProfile = false;
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(userRef);
      const settings = qaSeedSettings(snapshot.exists() ? (snapshot.data().settings ?? {}) : null);
      if (settings) {
        transaction.set(userRef, { email, createdAt: Timestamp.now(), settings });
        createdProfile = true;
      }
    });
    const saved = await getDoc(userRef);
    if (!saved.exists() || qaSeedSettings(saved.data().settings) !== null) throw new Error('QA fixture readback failed.');
    return { projectId: config.projectId, uid: credential.user.uid, createdProfile, onboardingCompleted: true, measurementUnit: 'imperial' };
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedQaAccount().then(result => console.log('[qa-bootstrap]', JSON.stringify(result))).catch(error => { console.error('[qa-bootstrap]', error.message); process.exitCode = 1; });
}
