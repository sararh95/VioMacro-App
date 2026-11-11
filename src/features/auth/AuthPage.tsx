import { useAuth } from '../../app/providers/auth-context';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
    const { signInWithGoogle, signInWithEmail, registerWithEmail, user } = useAuth();
    const navigate = useNavigate();
    const useFirebaseEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
    const googleSignInEnabled = import.meta.env.VITE_ENABLE_GOOGLE_SIGN_IN === 'true' && !useFirebaseEmulators;

    // State
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleGoogleSignIn = async () => {
        if (!googleSignInEnabled) {
            setError('Google sign-in is not enabled for the current private alpha. Please use email for now.');
            return;
        }

        try {
            setError('');
            await signInWithGoogle();
        } catch (error) {
            console.error("Sign in failed", error);
            setError('Failed to sign in with Google');
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await registerWithEmail(email, password);
            }
        } catch (err: unknown) {
            console.error(err);
            const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : '';
            if (
                code === 'auth/invalid-credential' ||
                code === 'auth/user-not-found' ||
                code === 'auth/wrong-password' ||
                code === 'auth/invalid-email'
            ) {
                setError('Invalid email or password');
            } else if (code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else if (code === 'auth/weak-password') {
                setError('Password should be at least 6 characters');
            } else {
                setError('Authentication failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-surface-dark border-r border-surface-border">
                {/* Decorative gradient shape */}
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl transform translate-x-1/2" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '28px', fontWeight: 700 }}>bolt</span>
                    </div>
                </div>

                {/* Hero Text */}
                <div className="relative z-10 max-w-md">
                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Unlock your{' '}
                        <span className="text-primary">metabolic</span>
                        <br />
                        potential.
                    </h1>
                    <p className="text-text-secondary text-lg leading-relaxed">
                        VioMacro synthesizes metabolic science, behavioral psychology, and seamless UX to provide a comprehensive coaching system for dietary adherence.
                    </p>
                </div>

                {/* Social Proof */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex -space-x-2">
                        <div className="w-10 h-10 rounded-full bg-surface-dark border-2 border-background-dark flex items-center justify-center text-text-secondary">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface-dark border-2 border-background-dark flex items-center justify-center text-text-secondary">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-surface-dark border-2 border-background-dark flex items-center justify-center text-text-secondary">
                            <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-white font-semibold">Private alpha access</p>
                        <p className="text-text-secondary text-sm">for focused nutrition workflow testing.</p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                <div className="bg-surface-dark border border-surface-border rounded-3xl w-full max-w-[480px] p-8 md:p-10 shadow-2xl relative overflow-hidden">

                    {/* Mode Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-white mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-text-secondary">
                            Manage your nutrition intelligently with AI.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="bg-background-dark p-1 rounded-xl flex mb-8 border border-surface-border">
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'login'
                                    ? 'bg-surface-dark text-white shadow-sm ring-1 ring-surface-border'
                                    : 'text-text-secondary hover:text-white'
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setMode('signup'); setError(''); }}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${mode === 'signup'
                                    ? 'bg-surface-dark text-white shadow-sm ring-1 ring-surface-border'
                                    : 'text-text-secondary hover:text-white'
                                }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={!googleSignInEnabled}
                        title={googleSignInEnabled ? 'Continue with Google' : 'Google sign-in is not enabled for this private alpha'}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all mb-8 shadow-lg shadow-white/5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {googleSignInEnabled ? 'Continue with Google' : 'Google Sign-In Coming Soon'}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-px bg-surface-border"></div>
                        <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Or continue with email</span>
                        <div className="flex-1 h-px bg-surface-border"></div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4 mb-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-background-dark border border-surface-border rounded-xl py-3.5 px-4 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-xs font-bold text-text-secondary uppercase">Password</label>
                                {mode === 'login' && (
                                    <button
                                        disabled
                                        title="Password reset coming soon"
                                        className="text-xs text-text-secondary font-bold cursor-not-allowed"
                                    >
                                        Password Reset Coming Soon
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-background-dark border border-surface-border rounded-xl py-3.5 px-4 text-white placeholder:text-text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>

                    {/* Primary Action */}
                    <button
                        onClick={handleEmailAuth}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            mode === 'login' ? 'Log In' : 'Create Account'
                        )}
                    </button>

                    {/* Footer Security Badge */}
                    <div className="flex items-center justify-center gap-2 text-text-secondary opacity-60">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span className="text-xs font-medium">Secure & Encrypted Connection</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
