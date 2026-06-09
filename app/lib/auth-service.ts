import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getErrorMessage } from './error-utils';

// Set persistence to LOCAL (remember user across browser restarts)
const getAuth = () => {
  const auth = getFirebaseAuth();
  void setPersistence(auth, browserLocalPersistence);
  return auth;
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

// Sign up with email and password
export const signUp = async (data: SignUpData) => {
  try {
    const { user } = await createUserWithEmailAndPassword(
      getAuth(),
      data.email,
      data.password
    );

    // Create user document in Firestore
    await setDoc(doc(getFirestoreDb(), 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      userType: data.userType,
      emailVerified: user.emailVerified,
      accountStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    });

    return user;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Sign up failed'));
  }
};

// Login with email and password
export const login = async (data: LoginData) => {
  try {
    const { user } = await signInWithEmailAndPassword(
      getAuth(),
      data.email,
      data.password
    );

    // Update last login timestamp
    await setDoc(
      doc(getFirestoreDb(), 'users', user.uid),
      { lastLogin: new Date() },
      { merge: true }
    );

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
