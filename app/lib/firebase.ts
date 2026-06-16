import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type FirebaseClientConfig = typeof firebaseConfig;

const FIREBASE_CLIENT_CONFIG_KEYS: Array<
  readonly [string, keyof FirebaseClientConfig]
> = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', 'apiKey'],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'projectId'],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', 'appId'],
];

export const getMissingFirebaseClientConfigKeys = (
  config: FirebaseClientConfig = firebaseConfig
) =>
  FIREBASE_CLIENT_CONFIG_KEYS
    .filter(([, configKey]) => !config[configKey]?.trim())
    .map(([envKey]) => envKey);

export const getFirebaseClientConfigErrorMessage = (
  missing: readonly string[]
) =>
  missing.length === 0
    ? ''
    : `Firebase web configuration is missing: ${missing.join(', ')}. Add these variables in the local environment or hosting dashboard. Secret values are never printed.`;

const getFirebaseApp = () => {
  const missing = getMissingFirebaseClientConfigKeys();

  if (missing.length > 0) {
    throw new Error(getFirebaseClientConfigErrorMessage(missing));
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = () => getAuth(getFirebaseApp());

export const getFirestoreDb = () => getFirestore(getFirebaseApp());

export const getFirebaseStorage = () => getStorage(getFirebaseApp());

export default getFirebaseApp;
