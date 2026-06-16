import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import {
  normalizeFirebasePrivateKey,
  validateServerFirebaseEnv,
} from './env-validation';

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = normalizeFirebasePrivateKey(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );

  if (!projectId) {
    throw new Error('Firebase Admin server configuration is unavailable.');
  }

  const serverEnv = validateServerFirebaseEnv();
  if (!serverEnv.ok && (clientEmail || privateKey)) {
    throw new Error('Firebase Admin server configuration is incomplete.');
  }

  if (clientEmail && privateKey && projectId) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  // Supports Application Default Credentials on managed hosting.
  return initializeApp({ projectId });
};

export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminDb = () => getFirestore(getAdminApp());
