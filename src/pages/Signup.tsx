import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon } from 'lucide-react';
import { registerWithEmail } from '../services/authService.ts';

interface SignupProps {
  onNavigateLogin: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function Signup({ onNavigateLogin }: SignupProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  const validateFields = (): boolean => {
    const nextErrors: FieldErrors = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      nextErrors.fullName = 'Full name is required.';
    } else if (cleanName.length < 2) {
      nextErrors.fullName = 'Full name must be at least 2 characters.';
    } else if (cleanName.length > 100) {
      nextErrors.fullName = 'Full name must be 100 characters or fewer.';
    }

    if (!cleanEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      nextErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    if (!validateFields()) return;

    setIsSubmitting(true);
    try {
      await registerWithEmail(fullName, email, password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to create account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-xl p-7 sm:p-8 shadow-xs">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={onNavigateLogin}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Login</span>
            </button>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Set up your personal STUDYFLOW workspace to track tasks, exams, study blocks, and goals.
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearFieldError('fullName');
                  }}
                  disabled={isSubmitting}
                  placeholder="Alex Rivera"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    errors.fullName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p id="signup-name-error" className="mt-1.5 text-xs text-red-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="signup-email"
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
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  disabled={isSubmitting}
                  placeholder="student@university.edu"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'signup-email-error' : undefined}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {errors.email && (
                <p id="signup-email-error" className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
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
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  disabled={isSubmitting}
                  placeholder="Create a strong password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-rules'}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
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
              {errors.password && (
                <p id="signup-password-error" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}

              {/* Password Strength Checklist */}
              <ul
                id="signup-password-rules"
                className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500"
              >
                {[
                  { label: '8+ characters', met: hasMinLength },
                  { label: 'Uppercase letter', met: hasUppercase },
                  { label: 'Lowercase letter', met: hasLowercase },
                  { label: 'At least 1 number', met: hasNumber },
                ].map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 ${
                      rule.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    <Check
                      className={`h-3 w-3 shrink-0 ${
                        rule.met ? 'text-emerald-600' : 'text-slate-300'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  disabled={isSubmitting}
                  placeholder="Re-enter your password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? 'signup-confirm-error' : undefined
                  }
                  className={`w-full pl-9 pr-10 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="signup-confirm-error" className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              disabled={isSubmitting}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-50 cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
