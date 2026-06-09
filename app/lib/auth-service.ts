import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
} from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getErrorMessage } from './error-utils';

const getAuth = () => {
  return getFirebaseAuth();
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMessage: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, 20000);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export interface SignUpData {
  email: string;
  password: string;
  userType: 'TALENT' | 'RECRUITER';
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Sign up with email and password
export const signUp = async (data: SignUpData) => {
  try {
    const { user } = await withTimeout(
      createUserWithEmailAndPassword(getAuth(), data.email, data.password),
      'Firebase sign up timed out. Check Email/Password auth and network access.'
    );

    localStorage.setItem(`userType_${user.uid}`, data.userType);
    await setPersistence(getAuth(), browserLocalPersistence);
    await sendEmailVerification(user);

    // Create user document in Firestore
    await withTimeout(
      setDoc(doc(getFirestoreDb(), 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        userType: data.userType,
        emailVerified: user.emailVerified,
        accountStatus: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      }),
      'Firestore profile creation timed out. Check Firestore setup and rules.'
    );

    return user;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Sign up failed'));
  }
};

// Login with email and password
export const login = async (data: LoginData) => {
  try {
    await setPersistence(
      getAuth(),
      data.rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const { user } = await withTimeout(
      signInWithEmailAndPassword(getAuth(), data.email, data.password),
      'Firebase login timed out. Check Email/Password auth and network access.'
    );

    // Authentication should still succeed if this optional audit write fails.
    void withTimeout(
      setDoc(
        doc(getFirestoreDb(), 'users', user.uid),
        { lastLogin: new Date() },
        { merge: true }
      ),
      'Firestore login update timed out. Check Firestore setup and rules.'
    ).catch(() => undefined);

    return user;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Login failed'));
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(getAuth());
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Logout failed'));
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(getAuth(), email);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Password reset email failed'));
  }
};

// Confirm password reset (used after user clicks email link)
export const confirmReset = async (code: string, newPassword: string) => {
  try {
    await confirmPasswordReset(getAuth(), code, newPassword);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Password reset failed'));
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return getAuth().currentUser;
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return getAuth().onAuthStateChanged(callback);
};
