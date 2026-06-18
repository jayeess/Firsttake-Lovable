import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User,
  setPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getErrorMessage } from './error-utils';
import { normalizeAppUrl } from './app-url';

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
}

export const prepareTabSession = async () => {
  await setPersistence(getAuth(), browserSessionPersistence);
};

const getEmailVerificationRedirectUrl = () => {
  // Production should set:
  // NEXT_PUBLIC_APP_URL=https://firsttake-lovable.vercel.app
  const configuredUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  const browserUrl =
    typeof window === 'undefined' ? '' : normalizeAppUrl(window.location.origin);
  return `${configuredUrl || browserUrl || 'http://localhost:3000'}/auth/email-verified`;
};

export const sendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user, {
      url: getEmailVerificationRedirectUrl(),
      handleCodeInApp: false,
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Verification email could not be sent'));
  }
};

export const reloadUserVerification = async (user: User) => {
  try {
    await user.reload();
    await user.getIdToken(true);
    return user.emailVerified;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Verification status could not be refreshed'));
  }
};

// Sign up with email and password
export const signUp = async (data: SignUpData) => {
  try {
    await prepareTabSession();
    const { user } = await withTimeout(
      createUserWithEmailAndPassword(getAuth(), data.email, data.password),
      'Firebase sign up timed out. Check Email/Password auth and network access.'
    );

    try {
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
    } catch (profileError: unknown) {
      await deleteUser(user).catch(() => undefined);
      throw profileError;
    }

    localStorage.setItem(`userType_${user.uid}`, data.userType);
    void sendVerificationEmail(user).catch(() => undefined);

    return user;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Sign up failed'));
  }
};

// Login with email and password
export const login = async (data: LoginData) => {
  try {
    await prepareTabSession();
    const { user } = await withTimeout(
      signInWithEmailAndPassword(getAuth(), data.email, data.password),
      'Firebase login timed out. Check Email/Password auth and network access.'
    );

    // Never create a partial user record during login. Missing account records
    // are repaired by the auth context using the locally stored signup role.
    void withTimeout(
      updateDoc(doc(getFirestoreDb(), 'users', user.uid), {
        lastLogin: new Date(),
      }),
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
export const onAuthStateChange = (
  callback: (user: User | null) => void,
  onError?: (error: Error) => void
) => {
  return getAuth().onAuthStateChanged(callback, onError);
};
