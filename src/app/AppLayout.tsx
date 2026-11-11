import { useLocation, NavLink as RouterNavLink, Link } from 'react-router-dom';
import { useAuth } from './providers/auth-context';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { getStartOfWeek } from '../shared/date-utils';
import { avatarGradientByName, isRemoteAvatar } from '../shared/visuals';
import { getPendingSaveCount, subscribePendingSaves } from '../shared/pending-saves';

function PendingSavesNotice() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        let timer: number | undefined;
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        const update = () => {
            if (getPendingSaveCount() > 0) {
                window.addEventListener('beforeunload', warn);
                timer ??= window.setTimeout(() => setVisible(true), 1500);
            } else {
                window.removeEventListener('beforeunload', warn);
                window.clearTimeout(timer);
                timer = undefined;
                setVisible(false);
            }
        };
        const unsubscribe = subscribePendingSaves(update);
        update();
        return () => {
            unsubscribe();
            window.clearTimeout(timer);
            window.removeEventListener('beforeunload', warn);
        };
    }, []);

    return visible ? (
        <div role="status" className="pointer-events-none absolute inset-x-0 top-16 z-20 border-b border-surface-border bg-surface-dark px-4 py-2 text-xs text-text-secondary">
            Not saved yet. Keep this page open until your changes are saved.
        </div>
    ) : null;
}

type ShellItem = {
    label: string;
    icon: string;
    path: string;
    badge?: string | null;
};

/**
 * AUD-111: this used to be declared INSIDE AppLayout.
 *
 * A component defined inside another component is a new component type on every
 * render. React cannot reconcile it against the previous one, so it unmounts the
 * old subtree and mounts a fresh one -- it does not re-render, it replaces. Every
 * AppLayout render therefore destroyed and rebuilt all seven nav links, dropping
 * focus and restarting CSS transitions for nothing.
 *
 * Module scope means one stable type for the life of the app.
 */
const NavLink = ({ item, onClick }: { item: ShellItem; onClick?: () => void }) => {
    const isComingSoon = item.badge === 'Soon';

    if (isComingSoon) {
        return (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 text-gray-600 cursor-not-allowed border-transparent transition-all">
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-border text-text-secondary">Soon</span>
            </div>
        );
    }

    return (
        <RouterNavLink
            to={item.path}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group border-l-2",
                isActive
                    ? "bg-primary/10 text-primary border-primary"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10"
            )}
        >
            {({ isActive }) => (
                <>
                    <span
                        className={clsx(
                            "material-symbols-outlined transition-colors",
                            isActive ? "" : "group-hover:text-primary"
                        )}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                        {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary text-sidebar-dark">
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </RouterNavLink>
    );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, initError, retryInitialize } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems: ShellItem[] = [
        { label: 'Dashboard', icon: 'grid_view', path: '/' },
        { label: 'Plan', icon: 'calendar_month', path: '/plan' },
        { label: 'Recipes', icon: 'menu_book', path: '/recipes' },
        { label: 'Progress', icon: 'history', path: '/progress' },
    ];

    const inventoryItems: ShellItem[] = [
        { label: 'Grocery List', icon: 'shopping_cart', path: '/grocery', badge: null },
        { label: 'Pantry', icon: 'inventory_2', path: '/pantry', badge: null },
    ];

    const footerItems: ShellItem[] = [
        { label: 'Settings', icon: 'settings', path: '/settings', badge: null },
    ];

    const getShellTitle = () => {
        const allItems = [...menuItems, ...inventoryItems, ...footerItems];
        const exactMatch = allItems.find((item) => item.path === location.pathname);
        if (exactMatch) return exactMatch.label;

        if (location.pathname.startsWith('/recipes')) return 'Recipes';
        if (location.pathname.startsWith('/plan')) return 'Plan';
        if (location.pathname.startsWith('/grocery')) return 'Grocery List';
        if (location.pathname.startsWith('/pantry')) return 'Pantry';
        if (location.pathname.startsWith('/progress')) return 'Progress';
        if (location.pathname.startsWith('/settings')) return 'Settings';

        return 'VioMacro';
    };


    const getUserInitials = () => {
        if (!user?.displayName) return 'U';
        return user.displayName.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2);
    };

    const profileLink = (
        <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            aria-label="Open profile settings"
        >
            {/* AUD-104: photoURL now holds a local colour name, not a remote URL.
                Real URLs (e.g. from a future Google sign-in) still render as an
                image; legacy dicebear URLs fall through to initials so no old
                profile keeps fetching from a third party. */}
            {isRemoteAvatar(user?.photoURL) ? (
                <img
                    src={user!.photoURL!}
                    alt="Profile"
                    className="size-9 rounded-full ring-2 ring-white/10 group-hover:ring-primary/50 transition-all object-cover"
                />
            ) : (
                <div
                    className="size-9 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10 group-hover:ring-primary/50 transition-all"
                    style={{ background: avatarGradientByName(user?.photoURL || user?.uid || 'default') }}
                >
                    {getUserInitials()}
                </div>
            )}
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {user?.displayName || 'User'}
                </span>
                <span className="text-xs text-gray-500 truncate">Profile settings</span>
            </div>
        </Link>
    );

    return (
        <div className="flex h-screen bg-background-dark text-white font-display antialiased overflow-hidden">
            <aside className="w-72 h-full bg-sidebar-dark border-r border-white/5 hidden md:flex flex-col justify-between shrink-0">
                <div className="px-6 py-8 flex items-center gap-3">
                    <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary/40 shadow-[0_0_15px_rgba(167,139,250,0.3)]">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '24px', fontWeight: 700 }}>bolt</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-lg font-bold tracking-wide leading-none">VioMacro</h1>
                        <span className="text-primary/80 text-xs font-medium tracking-wider mt-0.5">Meal Planner</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto space-y-8">
                    <div className="flex flex-col gap-1.5">
                        <Link to="/recipes" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 mb-4 group">
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform" style={{ fontSize: '20px' }}>add_circle</span>
                            <span>Create Recipe</span>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Menu</p>
                        {menuItems.map((item) => (
                            <NavLink key={item.path} item={item} />
                        ))}
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Inventory</p>
                        {inventoryItems.map((item) => (
                            <NavLink key={item.path} item={item} />
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5 flex flex-col gap-2 bg-sidebar-dark">
                    {footerItems.map((item) => (
                        <NavLink key={item.path} item={item} />
                    ))}

                    <div className="mt-2 pt-4 border-t border-white/5 flex items-center gap-2">
                        {profileLink}
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                logout();
                            }}
                            aria-label="Sign out"
                            title="Sign out"
                            className="shrink-0 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 md:px-8 bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10">
                    <button
                        type="button"
                        aria-label="Open navigation menu"
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-navigation-drawer"
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>

                    <h2 className="text-xl font-semibold text-white hidden md:block">
                        {getShellTitle()}
                    </h2>

                    <div className="flex items-center gap-4">
                        <button
                            disabled
                            title="Notifications coming soon"
                            aria-label="Notifications coming soon"
                            className="relative p-2 text-gray-600 cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-background-dark"></span>
                        </button>
                        <div className="hidden md:block h-8 w-px bg-white/10"></div>
                        <span className="hidden md:block text-sm text-gray-400">
                            Week of {getStartOfWeek().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Planning
                        </span>
                    </div>
                </header>

                <PendingSavesNotice />
                <div className="flex-1 overflow-y-auto">
                    {initError && (
                <div
                    role="alert"
                    className="mx-4 mt-4 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"
                >
                    <span>{initError}</span>
                    <button
                        type="button"
                        onClick={() => { void retryInitialize(); }}
                        className="self-start rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-50 transition-colors hover:bg-amber-500/30 sm:self-auto"
                    >
                        Retry setup
                    </button>
                </div>
            )}
            {children}
                </div>
            </main>

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={clsx(
                "fixed top-0 left-0 h-full w-72 bg-sidebar-dark border-r border-white/5 flex flex-col z-50 transform transition-transform duration-300 md:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
                id="mobile-navigation-drawer"
            >
                <div className="px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary/40 shadow-[0_0_15px_rgba(167,139,250,0.3)]">
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '24px', fontWeight: 700 }}>bolt</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white text-lg font-bold tracking-wide leading-none">VioMacro</h1>
                            <span className="text-primary/80 text-xs font-medium tracking-wider mt-0.5">Meal Planner</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                        className="text-gray-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto space-y-8">
                    <div className="flex flex-col gap-1.5">
                        <Link
                            to="/recipes"
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 mb-4"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
                            <span>Create Recipe</span>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Menu</p>
                        {menuItems.map((item) => (
                            <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />
                        ))}
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Inventory</p>
                        {inventoryItems.map((item) => (
                            <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />
                        ))}
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="px-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Account</p>
                        {footerItems.map((item) => (
                            <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />
                        ))}
                    </div>
                </nav>

                <div className="p-4 pb-16 border-t border-white/5">
                    {profileLink}
                    <button
                        onClick={() => logout()}
                        aria-label="Sign out"
                        className="mt-3 flex items-center gap-3 px-3 py-2.5 w-full text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
