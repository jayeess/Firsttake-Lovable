import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run admin:set -- admin@example.com');
  process.exit(1);
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
  );
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
const auth = getAuth(app);
const db = getFirestore(app);
const user = await auth.getUserByEmail(email);

await auth.setCustomUserClaims(user.uid, {
  ...(user.customClaims ?? {}),
  admin: true,
});
await db.collection('users').doc(user.uid).set(
  {
    uid: user.uid,
    email: user.email ?? email,
    userType: 'ADMIN',
    accountStatus: 'ACTIVE',
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

console.log(`Admin claim granted to ${email} (${user.uid}).`);
console.log('The user must sign out and sign in again to refresh the ID token.');
