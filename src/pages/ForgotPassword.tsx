import { useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { resetPassword } from '../services/authService.ts';

interface ForgotPasswordProps {
  onNavigateLogin: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword({ onNavigateLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSending) return;
    setFormError(null);
    setSentToEmail(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your registered email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);

    setIsSending(true);
    try {
      await resetPassword(trimmedEmail);
      setSentToEmail(trimmedEmail);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to send password reset email. Please try again.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-8 shadow-xs">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6">
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
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 block leading-none">
                STUDYFLOW
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Plan Smarter. Study Better. Achieve More.
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Enter your registered email address and we will send you a link to reset your password.
          </p>

          {sentToEmail && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 flex items-start gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">Password reset email sent</p>
                <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">
                  If an account exists for <span className="font-semibold">{sentToEmail}</span>, a
                  reset link has been dispatched. Check your inbox and spam folder.
                </p>
              </div>
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

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <Mail
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  disabled={isSending}
                  placeholder="student@university.edu"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'reset-email-error' : undefined}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    emailError
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {emailError && (
                <p id="reset-email-error" className="mt-1.5 text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {isSending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{isSending ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={onNavigateLogin}
            disabled={isSending}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
