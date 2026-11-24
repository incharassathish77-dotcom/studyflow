import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { ForgotPassword } from './pages/ForgotPassword.tsx';
import { Login } from './pages/Login.tsx';
import { Signup } from './pages/Signup.tsx';
import {
  logoutUser,
  registerSessionExpiredHandler,
  subscribeToAuthState,
} from './services/authService.ts';

type AuthRoute = 'login' | 'signup' | 'forgot-password';

function readAuthRouteFromHash(): AuthRoute {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'signup' || hash === 'register') return 'signup';
  if (hash === 'forgot-password' || hash === 'reset-password') return 'forgot-password';
  return 'login';
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authRoute, setAuthRoute] = useState<AuthRoute>(() => readAuthRouteFromHash());
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const navigateAuth = useCallback((route: AuthRoute) => {
    setAuthRoute(route);
    const targetHash = `#/${route}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, []);

  useEffect(() => {
    const unregister = registerSessionExpiredHandler((message) => {
      setSessionNotice(message);
      navigateAuth('login');
    });
    return unregister;
  }, [navigateAuth]);

  useEffect(() => {
    const onHashChange = () => {
      if (!user) {
        setAuthRoute(readAuthRouteFromHash());
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setSessionNotice(null);
        if (
          window.location.hash === '#/login' ||
          window.location.hash === '#/signup' ||
          window.location.hash === '#/forgot-password'
        ) {
          window.history.replaceState(null, '', '#/dashboard');
        }
      } else {
        const nextRoute = readAuthRouteFromHash();
        setAuthRoute(nextRoute);
        if (window.location.hash === '#/dashboard') {
          window.history.replaceState(null, '', '#/login');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleExitGuestToSignup = useCallback(async () => {
    await logoutUser();
    navigateAuth('signup');
  }, [navigateAuth]);

  if (!authReady) {
    return <LoadingSpinner fullScreen label="Initializing STUDYFLOW..." />;
  }

  if (user) {
    return <Dashboard user={user} onExitGuestToSignup={handleExitGuestToSignup} />;
  }

  if (authRoute === 'signup') {
    return <Signup onNavigateLogin={() => navigateAuth('login')} />;
  }

  if (authRoute === 'forgot-password') {
    return <ForgotPassword onNavigateLogin={() => navigateAuth('login')} />;
  }

  return (
    <Login
      onNavigateSignup={() => navigateAuth('signup')}
      onNavigateForgotPassword={() => navigateAuth('forgot-password')}
      sessionNotice={sessionNotice}
      onDismissNotice={() => setSessionNotice(null)}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <OfflineIndicator />
    </ErrorBoundary>
  );
}
