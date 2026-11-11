import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators if in development
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator } from "firebase/functions";

// AUD-042: injected by vite.config.ts from firebase.json. See
// scripts/emulator-ports.mjs -- the ports are declared in exactly one file.
declare const __EMULATOR_PORTS__: {
    firestore: number;
    auth: number;
    storage: number;
    functions: number;
};
const EMULATOR_PORTS = __EMULATOR_PORTS__;

const useFirebaseEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (useFirebaseEmulators) {
    // Note: connecting to 127.0.0.1 instead of localhost often fixes connection refused errors
    //
    // AUD-042: these numbers come from firebase.json via vite.config.ts, so the
    // client cannot drift from what the emulators actually bind.
    connectFirestoreEmulator(db, '127.0.0.1', EMULATOR_PORTS.firestore);
    connectAuthEmulator(auth, `http://127.0.0.1:${EMULATOR_PORTS.auth}`);
    connectStorageEmulator(storage, '127.0.0.1', EMULATOR_PORTS.storage);
    connectFunctionsEmulator(functions, '127.0.0.1', EMULATOR_PORTS.functions);

    // Enable App Check debug token in development
    // @ts-expect-error Firebase App Check reads this browser global in development and e2e.
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Initialize App Check (ReCAPTCHA v3)
// We wrap this to avoid issues during build/SSR if context is missing
if (typeof window !== "undefined" && !useFirebaseEmulators) {
    if (!recaptchaSiteKey) {
        const message = "Missing VITE_RECAPTCHA_SITE_KEY. App Check cannot protect Firebase calls.";
        if (import.meta.env.PROD) {
            throw new Error(message);
        }
        console.warn(message);
    } else {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true
        });
    }
}
