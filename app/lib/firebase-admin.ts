import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('Firebase Admin server configuration is unavailable.');
  }

  if ((clientEmail && !privateKey) || (!clientEmail && privateKey)) {
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
