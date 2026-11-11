import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    type User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { auth } from '../../services/firebase/firebase';
import { initializeUser } from '../../services/userService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    /** AUD-012: set when account setup failed, so the app can say so. */
    initError: string | null;
    retryInitialize: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    registerWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
    /** AUD-011: bumped on a profile edit so consumers re-render without losing the User instance. */
    profileVersion: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState<string | null>(null);
    /**
     * AUD-011: `setUser({ ...auth.currentUser })` used to force a re-render after
     * a profile edit. The Firebase `User` is a class instance, so object spread
     * copies own enumerable properties only and silently drops every prototype
     * method -- `getIdToken`, `reload`, `delete`, `toJSON`. What landed in state
     * was a lookalike that would crash the first time anything needed a fresh ID
     * token.
     *
     * The real instance is kept, and this counter provides the re-render.
     */
    const [profileVersion, setProfileVersion] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                try {
                    // AUD-010: setLoading(false) used to run BEFORE this await, so
                    // the app rendered while the user document might not exist yet.
                    // Onboarding could then save real settings, and initializeUser
                    // -- still holding a transaction that saw no document -- would
                    // write createDefaultUserSettings() over the top of them.
                    await initializeUser(user.uid, user.email);
                    setInitError(null);
                } catch (error) {
                    // AUD-012: this was swallowed to console, so a failed setup
                    // left the user on a working-looking app with no settings
                    // document -- and every later save failed confusingly.
                    console.error('Error initializing user:', error);
                    setInitError('We could not finish setting up your account. Some settings may not save until you retry.');
                }
            } else {
                setInitError(null);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // AUD-013: these were rebuilt on every render, and so was the context value
    // below, so every useAuth() consumer re-rendered whenever this provider did.
    const signInWithGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    }, []);

    const signInWithEmail = useCallback(async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    }, []);

    const registerWithEmail = useCallback(async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(auth, email, pass);
    }, []);

    const retryInitialize = useCallback(async () => {
        if (!auth.currentUser) return;
        try {
            await initializeUser(auth.currentUser.uid, auth.currentUser.email);
            setInitError(null);
        } catch (error) {
            console.error('Retry of user initialization failed:', error);
            setInitError('Setup is still failing. Check your connection and try again.');
        }
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const updateUserProfile = useCallback(async (profile: { displayName?: string; photoURL?: string }) => {
        if (!auth.currentUser) return;
        await updateProfile(auth.currentUser, profile);
        await auth.currentUser.reload();
        // AUD-011: keep the real User instance, and re-render via the counter.
        setUser(auth.currentUser);
        setProfileVersion((version) => version + 1);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        initError,
        retryInitialize,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        logout,
        updateUserProfile,
        // Not part of the public contract; it exists so a profile edit still
        // produces a new context value even though `user` is the same instance.
        profileVersion,
    }), [
        user,
        loading,
        initError,
        profileVersion,
        retryInitialize,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        logout,
        updateUserProfile,
    ]);

    /**
     * AUD-013b: this used to render `{!loading && children}`, which made the
     * `if (loading)` branch in App.tsx unreachable dead code -- two owners for
     * one loading state, and the one that actually ran could not show a spinner
     * inside the app shell.
     *
     * Children now always mount, and App.tsx owns the loading UI.
     */
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
