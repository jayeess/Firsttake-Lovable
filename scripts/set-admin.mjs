import nextEnv from '@next/env';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectRoot, true);

const normalizeEmailArgument = (value) => {
  const trimmed = value?.trim() ?? '';
  const markdownMatch = trimmed.match(
    /^\[([^\]]+)\]\(mailto:([^)]+)\)$/i
  );
  return markdownMatch ? markdownMatch[2].trim() : trimmed;
};

const email = normalizeEmailArgument(process.argv[2]);
if (!email) {
  console.error('Usage: npm run admin:set -- admin@example.com');
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(
    'Invalid email argument. Use: npm run admin:set -- admin@example.com'
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  '\n'
);

const requiredVariables = {
  FIREBASE_ADMIN_PROJECT_ID: projectId,
  FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail,
  FIREBASE_ADMIN_PRIVATE_KEY: privateKey,
};
const missingVariables = Object.entries(requiredVariables)
  .filter(([, value]) => !value?.trim())
  .map(([name]) => name);

if (missingVariables.length > 0) {
  console.error(
    `Missing Firebase Admin environment variables: ${missingVariables.join(', ')}. ` +
      'Add them to the root .env.local file or the current process environment.'
  );
  process.exit(1);
}

try {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      console.error(
        `No Firebase Authentication user exists for ${email}. Create the account first, then rerun this command.`
      );
      process.exit(1);
    }
    throw error;
  }

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
      isAdmin: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`Admin access granted to ${email} (${user.uid}).`);
  console.log('Sign out and sign in again to refresh the Firebase ID token.');
} catch (error) {
  console.error(
    `Admin setup failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
