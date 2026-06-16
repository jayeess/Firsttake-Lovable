import { loadEnvConfig } from '@next/env';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

loadEnvConfig(process.cwd());

const confirmed = process.argv.includes('--confirm-demo-data');
if (!confirmed) {
  console.error(
    'Refusing to seed demo data. Re-run with --confirm-demo-data against the local emulator.'
  );
  process.exit(1);
}

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    'Refusing to seed demo data without FIRESTORE_EMULATOR_HOST. This script is emulator-only.'
  );
  process.exit(1);
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'demo-nata-connect';
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp(
    clientEmail && privateKey
      ? { credential: cert({ projectId, clientEmail, privateKey }), projectId }
      : { projectId }
  );
}

const db = getFirestore();
const now = Timestamp.now();
const deadline = Timestamp.fromDate(new Date(Date.now() + 21 * 86_400_000));

await db.collection('users').doc('demo-recruiter').set(
  {
    uid: 'demo-recruiter',
    email: 'recruiter.demo@example.com',
    userType: 'RECRUITER',
    accountStatus: 'ACTIVE',
    verificationStatus: 'approved',
    isAdmin: false,
    updatedAt: now,
  },
  { merge: true }
);

await db.collection('recruiterVerifications').doc('demo-recruiter').set(
  {
    recruiterId: 'demo-recruiter',
    recruiterEmail: 'recruiter.demo@example.com',
    legalName: 'Nata Demo Casting',
    contactPerson: 'Demo Producer',
    phone: '+971000000000',
    businessType: 'Production company',
    workDescription: 'Demo account for local beta walkthroughs.',
    status: 'approved',
    submittedAt: now,
    reviewedAt: now,
    updatedAt: now,
  },
  { merge: true }
);

await db
  .collection('users')
  .doc('demo-recruiter')
  .collection('recruiterProfiles')
  .doc('demo-recruiter')
  .set(
    {
      companyName: 'Nata Demo Casting',
      phone: '+971000000000',
      address: 'Dubai',
      website: 'https://example.com',
      bio: 'Demo casting team for beta QA.',
      isVerified: true,
      verificationStatus: 'approved',
    },
    { merge: true }
  );

await db.collection('auditions').doc('demo-audition').set(
  {
    recruiterId: 'demo-recruiter',
    recruiterName: 'Nata Demo Casting',
    recruiterVerified: true,
    title: 'Demo lead role for beta walkthrough',
    description: 'A safe sample audition for testing search and applications.',
    requirements: 'Comfortable on camera; Telugu or Hindi welcome.',
    category: 'ACTOR',
    experienceLevel: 'FRESHER',
    location: 'Dubai',
    duration: '2 shoot days',
    numberOfPositions: 1,
    payInfo: 'Honorarium',
    status: 'ACTIVE',
    moderationStatus: 'VISIBLE',
    applicantCount: 0,
    deadline,
    createdAt: now,
    updatedAt: now,
  },
  { merge: true }
);

await db.collection('users').doc('demo-talent').set(
  {
    uid: 'demo-talent',
    email: 'talent.demo@example.com',
    userType: 'TALENT',
    accountStatus: 'ACTIVE',
    talentVerificationStatus: 'verified',
    isAdmin: false,
    updatedAt: now,
  },
  { merge: true }
);

await db
  .collection('users')
  .doc('demo-talent')
  .collection('talentProfiles')
  .doc('demo-talent')
  .set(
    {
      firstName: 'Demo',
      lastName: 'Talent',
      age: 22,
      gender: 'OTHER',
      height: '5 ft 8 in',
      bio: 'Demo Talent profile for local beta QA.',
      category: 'ACTOR',
      experienceLevel: 'FRESHER',
      location: 'Dubai',
      skills: ['Screen acting', 'Improvisation'],
      languages: ['English', 'Telugu'],
      isPublic: true,
      publicProfileEnabled: false,
      talentVerificationStatus: 'verified',
      profileCompletenessScore: 90,
      updatedAt: now,
    },
    { merge: true }
  );

console.log('Demo data seeded into the Firestore emulator.');
