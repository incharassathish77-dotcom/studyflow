import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase.ts';
import { ensureUserProfile } from './firestoreService.ts';

let sessionExpiredCallback: ((message: string) => void) | null = null;

export function registerSessionExpiredHandler(cb: (message: string) => void): () => void {
  sessionExpiredCallback = cb;
  return () => {
    if (sessionExpiredCallback === cb) {
      sessionExpiredCallback = null;
    }
  };
}

export async function handleExpiredSession(
  message = 'Your session has expired. Please sign in again.',
): Promise<void> {
  sessionExpiredCallback?.(message);
  try {
    await signOut(auth);
  } catch {
    // Ignore signOut failure when session is already invalidated
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function subscribeToTokenChanges(callback: (user: User | null) => void): Unsubscribe {
  return onIdTokenChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<User> {
  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string,
): Promise<User> {
  const cleanName = fullName.trim().slice(0, 100);
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cleanName) {
      await updateProfile(result.user, { displayName: cleanName });
    }
    await ensureUserProfile(result.user, cleanName);
    return result.user;
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function loginAsGuest(): Promise<User> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInAnonymously(auth);
    await ensureUserProfile(result.user, 'Faculty Guest');
    return result.user;
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(formatAuthError(error));
  }
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';
    if (
      code === 'auth/user-token-expired' ||
      code === 'auth/user-disabled' ||
      code === 'auth/user-not-found'
    ) {
      await handleExpiredSession(formatAuthError(error));
    }
    throw new Error(formatAuthError(error));
  }
}

export function formatAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful attempts. Please wait a few minutes before trying again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-token-expired':
        return 'Your session has expired. Please sign in again.';
      case 'auth/operation-not-allowed':
      case 'auth/admin-restricted-operation':
        return 'This sign-in provider is not enabled yet. Enable Email/Password and Anonymous Sign-In in Firebase Console (Authentication > Sign-in method).';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing authentication.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in request was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error while connecting to authentication service.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for sign-in in your Firebase settings.';
      default:
        return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
    }
  }
  return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
}
