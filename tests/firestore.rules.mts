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
import {
  deleteObject,
  getBytes,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';

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
      setDoc(doc(db, 'auditions/pipeline-a'), audition('recruiter-a')),
      setDoc(doc(db, 'auditions/pipeline-a/applications/talent-a'), {
        talentId: 'talent-a',
        talentEmail: 'talent-a@example.test',
        coverMessage: 'Original submission',
        status: 'APPLIED',
        recruiterStatus: 'APPLIED',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      setDoc(
        doc(db, 'auditions/removed-a'),
        audition('recruiter-a', { moderationStatus: 'REMOVED' })
      ),
      setDoc(
        doc(db, 'auditions/closed-a'),
        audition('recruiter-a', { status: 'CLOSED' })
      ),
      setDoc(doc(db, 'notifications/talent-notification'), {
        recipientId: 'talent-a',
        recipientRole: 'TALENT',
        type: 'application_shortlisted',
        title: 'Shortlisted',
        message: 'A recruiter shortlisted your application.',
        read: false,
        createdBy: 'recruiter-a',
        priority: 'HIGH',
        metadata: {},
        createdAt: new Date(),
      }),
      setDoc(doc(db, 'notifications/admin-notification'), {
        recipientId: 'admin-a',
        recipientRole: 'ADMIN',
        type: 'talent_verification_submitted',
        title: 'Review requested',
        message: 'A Talent member requested verification.',
        read: false,
        createdBy: 'talent-a',
        priority: 'HIGH',
        metadata: {},
        createdAt: new Date(),
      }),
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
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules: await readFile('storage.rules', 'utf8'),
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
  assert.deepEqual(snapshot.docs.map((item) => item.id).sort(), [
    'pipeline-a',
    'visible-a',
  ]);
});

test('Talent cannot update recruiter-owned audition fields', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertFails(updateDoc(doc(db, 'auditions/visible-a'), { title: 'Changed' }));
});

test('Talent can submit verification but cannot self-verify', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const verificationRef = doc(db, 'talentVerifications/talent-a');
  await assertSucceeds(
    setDoc(verificationRef, {
      talentId: 'talent-a',
      talentEmail: 'talent-a@example.test',
      talentVerificationStatus: 'pending',
      profileCompletenessScore: 80,
      profileCompletenessChecklist: { basicInfo: true },
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  await assertFails(
    updateDoc(verificationRef, {
      talentVerificationStatus: 'verified',
      verifiedAt: serverTimestamp(),
    })
  );
});

test('Talent cannot edit admin-owned verification fields on their profile', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'users/talent-a/talentProfiles/talent-a'),
      {
        firstName: 'E2E_TEST',
        talentVerificationStatus: 'pending',
        verifiedAt: null,
      }
    );
  });
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertFails(
    updateDoc(doc(db, 'users/talent-a/talentProfiles/talent-a'), {
      talentVerificationStatus: 'verified',
      verifiedAt: serverTimestamp(),
    })
  );
});

test('Talent can create valid media metadata but cannot spoof ownership or moderation', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'users/talent-a/talentProfiles/talent-a'),
      { firstName: 'Talent', talentVerificationStatus: 'not_submitted' }
    );
  });
  const db = environment.authenticatedContext('talent-a').firestore();
  const mediaRef = doc(
    db,
    'users/talent-a/talentProfiles/talent-a/media/media-a'
  );
  const data = {
    ownerId: 'talent-a',
    type: 'image',
    title: 'Headshot',
    description: '',
    url: 'https://example.test/headshot.jpg',
    storagePath: 'talent-media/talent-a/portfolio/media-a/media-a.jpg',
    thumbnailUrl: '',
    externalUrl: '',
    mimeType: 'image/jpeg',
    sizeBytes: 1000,
    sortOrder: 0,
    isFeatured: true,
    visibility: 'recruiters',
    moderationStatus: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(mediaRef, data));
  await assertFails(
    setDoc(
      doc(db, 'users/talent-a/talentProfiles/talent-a/media/spoofed'),
      { ...data, ownerId: 'talent-b' }
    )
  );
  await assertFails(
    setDoc(
      doc(db, 'users/talent-a/talentProfiles/talent-a/media/hidden'),
      { ...data, moderationStatus: 'hidden' }
    )
  );
});

test('Talent cannot edit another Talent media or moderation status', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        'users/talent-a/talentProfiles/talent-a/media/media-a'
      ),
      {
        ownerId: 'talent-a',
        type: 'image',
        title: 'Headshot',
        visibility: 'recruiters',
        moderationStatus: 'active',
      }
    );
  });
  const ownerDb = environment.authenticatedContext('talent-a').firestore();
  const otherDb = environment.authenticatedContext('talent-b').firestore();
  const path = 'users/talent-a/talentProfiles/talent-a/media/media-a';
  await assertFails(
    updateDoc(doc(ownerDb, path), { moderationStatus: 'hidden' })
  );
  await assertFails(updateDoc(doc(otherDb, path), { title: 'Changed' }));
});

test('Admin can hide or remove Talent media metadata', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        'users/talent-a/talentProfiles/talent-a/media/media-a'
      ),
      {
        ownerId: 'talent-a',
        type: 'image',
        title: 'Headshot',
        visibility: 'recruiters',
        moderationStatus: 'active',
      }
    );
  });
  const db = environment
    .authenticatedContext('admin-a', { admin: true })
    .firestore();
  const ref = doc(
    db,
    'users/talent-a/talentProfiles/talent-a/media/media-a'
  );
  await assertSucceeds(updateDoc(ref, { moderationStatus: 'hidden' }));
  await assertSucceeds(updateDoc(ref, { moderationStatus: 'removed' }));
});

test('Storage accepts valid owner images and rejects another user path', async () => {
  const ownerStorage = environment.authenticatedContext('talent-a').storage();
  const otherStorage = environment.authenticatedContext('talent-b').storage();
  const path = 'talent-media/talent-a/profile/photo.jpg';
  const metadata = {
    contentType: 'image/jpeg',
    customMetadata: {
      ownerId: 'talent-a',
      visibility: 'recruiters',
      mediaKind: 'profile',
    },
  };
  await assertSucceeds(
    uploadBytes(storageRef(ownerStorage, path), new Uint8Array([1, 2, 3]), metadata)
  );
  await assertFails(
    uploadBytes(
      storageRef(otherStorage, 'talent-media/talent-a/profile/forged.jpg'),
      new Uint8Array([1, 2, 3]),
      metadata
    )
  );
});

test('Storage rejects unsupported media and allows approved Recruiter reads', async () => {
  const ownerStorage = environment.authenticatedContext('talent-a').storage();
  const recruiterStorage = environment
    .authenticatedContext('recruiter-a')
    .storage();
  const invalidRef = storageRef(
    ownerStorage,
    'talent-media/talent-a/portfolio/media-b/media-b.mp4'
  );
  await assertFails(
    uploadBytes(invalidRef, new Uint8Array([1, 2, 3]), {
      contentType: 'video/mp4',
      customMetadata: {
        ownerId: 'talent-a',
        visibility: 'recruiters',
        mediaKind: 'portfolio',
      },
    })
  );

  const validPath =
    'talent-media/talent-a/portfolio/media-a/media-a.webp';
  await assertSucceeds(
    uploadBytes(storageRef(ownerStorage, validPath), new Uint8Array([1, 2, 3]), {
      contentType: 'image/webp',
      customMetadata: {
        ownerId: 'talent-a',
        visibility: 'recruiters',
        mediaKind: 'portfolio',
      },
    })
  );
  await assertSucceeds(getBytes(storageRef(recruiterStorage, validPath)));
  await assertSucceeds(deleteObject(storageRef(ownerStorage, validPath)));
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

test('users can read only their own notifications', async () => {
  const ownerDb = environment.authenticatedContext('talent-a').firestore();
  const outsiderDb = environment.authenticatedContext('talent-b').firestore();
  await assertSucceeds(
    getDoc(doc(ownerDb, 'notifications/talent-notification'))
  );
  await assertFails(
    getDoc(doc(outsiderDb, 'notifications/talent-notification'))
  );
});

test('notification owners can mark read but cannot edit content or create records', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const notificationRef = doc(db, 'notifications/talent-notification');
  await assertSucceeds(
    updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    })
  );
  await assertFails(updateDoc(notificationRef, { title: 'Forged title' }));
  await assertFails(
    setDoc(doc(db, 'notifications/client-created'), {
      recipientId: 'talent-a',
      read: false,
    })
  );
});

test('admins can read notifications addressed to their own admin account', async () => {
  const db = environment
    .authenticatedContext('admin-a', { admin: true })
    .firestore();
  await assertSucceeds(
    getDoc(doc(db, 'notifications/admin-notification'))
  );
  await assertFails(
    getDoc(doc(db, 'notifications/talent-notification'))
  );
});

test('Application owner and audition owner can read an application', async () => {
  const path = 'auditions/pipeline-a/applications/talent-a';
  const talentDb = environment.authenticatedContext('talent-a').firestore();
  const ownerDb = environment.authenticatedContext('recruiter-a').firestore();
  const outsiderDb = environment.authenticatedContext('recruiter-b').firestore();
  await assertSucceeds(getDoc(doc(talentDb, path)));
  await assertSucceeds(getDoc(doc(ownerDb, path)));
  await assertFails(getDoc(doc(outsiderDb, path)));
});

test('audition owner can update allowed recruiter pipeline fields', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const ref = doc(db, 'auditions/pipeline-a/applications/talent-a');
  await assertSucceeds(
    updateDoc(ref, {
      status: 'UNDER_REVIEW',
      recruiterStatus: 'UNDER_REVIEW',
      statusUpdatedBy: 'recruiter-a',
      statusUpdatedAt: serverTimestamp(),
      lastRecruiterActionAt: serverTimestamp(),
      recruiterNote: 'Strong screen presence',
      recruiterRating: 4,
      internalTags: ['callback'],
      updatedAt: serverTimestamp(),
    })
  );
});

test('recruiter cannot update applications for another recruiter audition', async () => {
  const db = environment.authenticatedContext('recruiter-b').firestore();
  await assertFails(
    updateDoc(doc(db, 'auditions/pipeline-a/applications/talent-a'), {
      status: 'SHORTLISTED',
      recruiterStatus: 'SHORTLISTED',
      statusUpdatedBy: 'recruiter-b',
      updatedAt: serverTimestamp(),
    })
  );
});

test('Talent cannot set recruiter fields or recruiter-controlled status', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const ref = doc(db, 'auditions/pipeline-a/applications/talent-a');
  await assertFails(
    updateDoc(ref, {
      status: 'SELECTED',
      recruiterStatus: 'SELECTED',
      recruiterNote: 'Self approved',
      recruiterRating: 5,
    })
  );
});

test('recruiter cannot edit immutable application submission fields', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const ref = doc(db, 'auditions/pipeline-a/applications/talent-a');
  await assertFails(
    updateDoc(ref, {
      talentId: 'talent-b',
      coverMessage: 'Changed by recruiter',
      status: 'VIEWED',
      recruiterStatus: 'VIEWED',
    })
  );
});
