import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton.tsx';
import { loginAsGuest, loginWithEmail, signInWithGoogle } from '../services/authService.ts';

interface LoginProps {
  onNavigateSignup: () => void;
  onNavigateForgotPassword: () => void;
  sessionNotice?: string | null;
  onDismissNotice?: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login({
  onNavigateSignup,
  onNavigateForgotPassword,
  sessionNotice,
  onDismissNotice,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'email' | 'google' | 'guest' | null>(null);

  const isBusy = activeAction !== null;

  const validateInputs = (): boolean => {
    let valid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  };

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBusy) return;
    onDismissNotice?.();
    setFormError(null);

    if (!validateInputs()) return;

    setActiveAction('email');
    try {
      await loginWithEmail(email, password, rememberMe);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to log in. Please check your credentials.',
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
    onDismissNotice?.();
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    setActiveAction('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to sign in with Google. Please try again.',
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleGuestDemo = async () => {
    if (isBusy) return;
    onDismissNotice?.();
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    setActiveAction('guest');
    try {
      await loginAsGuest();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to start Guest Demo Mode. Please try again.',
      );
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-8 shadow-xs">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="font-display text-xl font-bold tracking-tight text-slate-900 block leading-none">
                  STUDYFLOW
                </span>
                <span className="text-xs text-slate-500 mt-1 block truncate">
                  Plan Smarter. Study Better. Achieve More.
                </span>
              </div>
            </div>

            <PWAInstallButton compact />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Sign in to manage your tasks, academic planner, calendar, and study analytics.
          </p>

          {sessionNotice && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {sessionNotice}
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
            className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {activeAction === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" aria-hidden="true" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
            )}
            <span>
              {activeAction === 'google' ? 'Signing in with Google...' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                or login with email
              </span>
            </div>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  disabled={isBusy}
                  placeholder="student@university.edu"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    emailError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {emailError && (
                <p id="login-email-error" className="mt-1.5 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isBusy}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'login-password-error' : undefined}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    passwordError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isBusy}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="login-password-error" className="mt-1.5 text-xs text-red-600">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isBusy}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={onNavigateForgotPassword}
                disabled={isBusy}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-50 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {activeAction === 'email' && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <span>{activeAction === 'email' ? 'Signing in...' : 'Login'}</span>
            </button>
          </form>

          {/* Guest Demo Mode */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGuestDemo}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {activeAction === 'guest' ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" aria-hidden="true" />
              )}
              <span>
                {activeAction === 'guest'
                  ? 'Preparing Guest Demo...'
                  : 'Continue as Guest / Demo Mode'}
              </span>
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Faculty preview with isolated sample academic data. No sign-up required.
            </p>
          </div>

          {/* Sign-Up Navigation */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onNavigateSignup}
              disabled={isBusy}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-50 cursor-pointer"
            >
              Create a New Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
