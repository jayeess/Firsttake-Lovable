import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const projectId = 'demo-nata-connect';
let environment: RulesTestEnvironment;

const user = (uid: string, userType: 'TALENT' | 'RECRUITER', suspended = false) => ({
  uid,
  email: `${uid}@example.test`,
  userType,
  accountStatus: suspended ? 'SUSPENDED' : 'ACTIVE',
  isAdmin: false,
});

const audition = (
  recruiterId: string,
  overrides: Record<string, unknown> = {}
) => ({
  recruiterId,
  recruiterName: 'E2E_TEST Studio',
  title: 'E2E_TEST Casting Call',
  description: 'Security-rule test fixture',
  category: 'ACTOR',
  experienceLevel: 'FRESHER',
  location: 'Test City',
  duration: 'One day',
  requirements: 'Test fixture',
  numberOfPositions: 1,
  applicantCount: 0,
  payInfo: '',
  deadline: new Date(Date.now() + 86_400_000),
  status: 'ACTIVE',
  moderationStatus: 'VISIBLE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/talent-a'), user('talent-a', 'TALENT')),
      setDoc(doc(db, 'users/talent-b'), user('talent-b', 'TALENT')),
      setDoc(doc(db, 'users/recruiter-a'), user('recruiter-a', 'RECRUITER')),
      setDoc(doc(db, 'users/recruiter-b'), user('recruiter-b', 'RECRUITER')),
      setDoc(
        doc(db, 'users/recruiter-suspended'),
        user('recruiter-suspended', 'RECRUITER', true)
      ),
      setDoc(doc(db, 'recruiterVerifications/recruiter-a'), {
        recruiterId: 'recruiter-a',
        status: 'approved',
      }),
      setDoc(doc(db, 'recruiterVerifications/recruiter-b'), {
        recruiterId: 'recruiter-b',
        status: 'approved',
      }),
      setDoc(doc(db, 'recruiterVerifications/recruiter-suspended'), {
        recruiterId: 'recruiter-suspended',
        status: 'approved',
      }),
      setDoc(doc(db, 'auditions/visible-a'), audition('recruiter-a')),
      setDoc(
        doc(db, 'auditions/removed-a'),
        audition('recruiter-a', { moderationStatus: 'REMOVED' })
      ),
      setDoc(
        doc(db, 'auditions/closed-a'),
        audition('recruiter-a', { status: 'CLOSED' })
      ),
    ]);
  });
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile('firestore.rules', 'utf8'),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
  await seed();
});

after(async () => {
  await environment.cleanup();
});

test('unauthenticated users cannot write protected data', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(db, 'users/anonymous'), user('anonymous', 'TALENT')));
});

test('Talent can read visible active auditions but not removed auditions', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'auditions/visible-a')));
  await assertFails(getDoc(doc(db, 'auditions/removed-a')));

  const visibleQuery = query(
    collection(db, 'auditions'),
    where('status', '==', 'ACTIVE'),
    where('moderationStatus', '==', 'VISIBLE')
  );
  const snapshot = await assertSucceeds(getDocs(visibleQuery));
  assert.deepEqual(snapshot.docs.map((item) => item.id), ['visible-a']);
});

test('Talent cannot update recruiter-owned audition fields', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertFails(updateDoc(doc(db, 'auditions/visible-a'), { title: 'Changed' }));
});

test('Talent can create only their own application to an active audition', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const data = {
    talentId: 'talent-a',
    talentEmail: 'talent-a@example.test',
    coverMessage: 'E2E_TEST application',
    status: 'APPLIED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastStatusChange: serverTimestamp(),
  };

  await assertSucceeds(
    setDoc(doc(db, 'auditions/visible-a/applications/talent-a'), data)
  );
  await assertFails(
    setDoc(doc(db, 'auditions/visible-a/applications/talent-b'), data)
  );
  await assertFails(
    setDoc(doc(db, 'auditions/closed-a/applications/talent-a'), data)
  );
});

test('Recruiters can create and manage only their own auditions', async () => {
  const ownDb = environment.authenticatedContext('recruiter-a').firestore();
  await assertSucceeds(
    setDoc(doc(ownDb, 'auditions/recruiter-a-new'), audition('recruiter-a'))
  );
  await assertSucceeds(
    updateDoc(doc(ownDb, 'auditions/visible-a'), { title: 'Updated title' })
  );

  const otherDb = environment.authenticatedContext('recruiter-b').firestore();
  await assertFails(
    updateDoc(doc(otherDb, 'auditions/visible-a'), { title: 'Hijacked title' })
  );
});

test('Recruiters cannot approve themselves', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  await assertFails(
    updateDoc(doc(db, 'recruiterVerifications/recruiter-a'), {
      status: 'approved',
      reviewedBy: 'recruiter-a',
    })
  );
});

test('Suspended recruiters cannot publish auditions', async () => {
  const db = environment
    .authenticatedContext('recruiter-suspended')
    .firestore();
  await assertFails(
    setDoc(
      doc(db, 'auditions/suspended-new'),
      audition('recruiter-suspended')
    )
  );
});

test('Non-admin users cannot write audit logs', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  await assertFails(
    setDoc(doc(db, 'auditLogs/client-write'), {
      action: 'forged',
      timestamp: serverTimestamp(),
    })
  );
});

test('Admins can read queues and audit logs but cannot client-write logs', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'auditLogs/server-log'), {
      action: 'E2E_TEST_action',
    });
  });
  const db = environment
    .authenticatedContext('admin-a', { admin: true })
    .firestore();
  await assertSucceeds(getDoc(doc(db, 'recruiterVerifications/recruiter-a')));
  await assertSucceeds(getDoc(doc(db, 'auditLogs/server-log')));
  await assertFails(setDoc(doc(db, 'auditLogs/admin-client-write'), { action: 'x' }));
});

test('Application owner and audition owner can read an application', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'auditions/visible-a/applications/talent-a'),
      { talentId: 'talent-a', status: 'APPLIED' }
    );
  });

  const path = 'auditions/visible-a/applications/talent-a';
  const talentDb = environment.authenticatedContext('talent-a').firestore();
  const ownerDb = environment.authenticatedContext('recruiter-a').firestore();
  const outsiderDb = environment.authenticatedContext('recruiter-b').firestore();
  await assertSucceeds(getDoc(doc(talentDb, path)));
  await assertSucceeds(getDoc(doc(ownerDb, path)));
  await assertFails(getDoc(doc(outsiderDb, path)));
});
