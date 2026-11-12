import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AppLayout from './AppLayout'
import ErrorBoundary from './ErrorBoundary'

/**
 * AUD-109: the app shipped as one 1.24 MB chunk, so every visitor downloaded the
 * charting library and all eight pages before the login screen could render. On
 * a phone on mobile data that was the single biggest thing between tapping the
 * link and seeing anything.
 *
 * AuthPage stays a static import on purpose: it is the first thing a signed-out
 * visitor sees, so lazy-loading it would add a round trip to exactly the path
 * this is meant to shorten. Everything behind the sign-in gate loads on demand,
 * which is what moves Recharts off the login screen.
 *
 * AUD-130: this was tried once before and backed out, because the Meal Planner
 * opened its "Plan for Week of X?" modal on a 500 ms timer -- so an extra round
 * trip made that modal land mid-interaction and eat pointer events. That prompt
 * is now driven by the plan read finishing, and never fires once the user has
 * started doing something. The two changes only work together.
 */
import AuthPage from '../features/auth/AuthPage'

const Dashboard = lazy(() => import('../features/dashboard/Dashboard'))
const RecipeLibrary = lazy(() => import('../features/recipes/RecipeLibrary'))
const MealPlanner = lazy(() => import('../features/meal-planning/MealPlanner'))
const ShoppingList = lazy(() => import('../features/groceries/ShoppingList'))
const Pantry = lazy(() => import('../features/pantry/Pantry'))
const History = lazy(() => import('../features/progress/History'))
const Settings = lazy(() => import('../features/settings/Settings'))
const ScreenMap = lazy(() => import('../dev/ScreenMap'))
import { AuthProvider, useAuth } from './providers/auth-context'
import { AppProvider, useAppStore } from './providers/store'

/**
 * AUD-013b: AuthProvider used to render `{!loading && children}`, so nothing at
 * all mounted until auth resolved and this `loading` branch was unreachable dead
 * code. The provider now always renders its children, which makes this the real
 * owner of the loading UI -- and means /auth needs the same guard, or a signed-in
 * user reloading the page sees the login form flash before being redirected.
 */
function AuthGate() {
  const { loading } = useAuth();

  if (loading) return <AuthLoading />;

  return <AuthPage />;
}

function AuthLoading() {
  return (
    <div className="flex items-center justify-center py-20" aria-busy="true">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="sr-only">Checking your sign-in</span>
    </div>
  );
}

function Protected() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      {/*
        * The boundary sits INSIDE AppLayout so the sidebar and header stay on
        * screen while a page chunk arrives. Wrapping the layout would blank the
        * whole shell on every navigation.
        */}
      <Suspense fallback={<AuthLoading />}>
        <SavedDataGate />
      </Suspense>
    </AppLayout>
  );
}

function SavedDataGate() {
  const { userSettings, loading, retrySavedData } = useAppStore();
  if (userSettings) return <Outlet />;
  if (loading.initial) return (
    <div className="p-8 text-text-secondary" role="status">Loading your saved data…</div>
  );
  return (
    <div className="p-8 space-y-4">
      <p role="alert" className="text-white">We could not load your saved settings. Retry to continue with your account.</p>
      <button onClick={retrySavedData} className="rounded-lg bg-primary px-5 py-3 font-bold text-white">
        Retry Saved Data
      </button>
    </div>
  );
}

function AppRoutes() {
  const showInternalRoutes = import.meta.env.DEV || import.meta.env.VITE_ENABLE_INTERNAL_QA_ROUTES === 'true';

  return (
    <Routes>
      <Route path="/auth" element={<AuthGate />} />

      <Route element={<Protected />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/plan" element={<MealPlanner />} />
        <Route path="/grocery" element={<ShoppingList />} />
        <Route path="/recipes" element={<RecipeLibrary />} />
        <Route path="/recipes/import" element={<RecipeLibrary initialAction="import" />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/progress" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        {showInternalRoutes && <Route path="/dev/map" element={<ScreenMap />} />}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
