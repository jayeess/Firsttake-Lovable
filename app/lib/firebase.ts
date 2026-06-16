import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getEnvErrorMessage,
  validatePublicFirebaseEnv,
} from './env-validation';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getFirebaseApp = () => {
  const status = validatePublicFirebaseEnv();

  if (!status.ok) {
    throw new Error(getEnvErrorMessage('Firebase web', status.missing));
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = () => getAuth(getFirebaseApp());

export const getFirestoreDb = () => getFirestore(getFirebaseApp());

export const getFirebaseStorage = () => getStorage(getFirebaseApp());

export default getFirebaseApp;
