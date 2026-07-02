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
  collectionGroup,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
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

const talentPoolEntry = (
  recruiterId: string,
  talentId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: `${recruiterId}__${talentId}`,
  recruiterId,
  talentId,
  talentNameSnapshot: 'Maya Rao',
  talentPublicSlug: 'maya-rao',
  talentCategorySnapshot: 'ACTOR',
  sourceApplicationId: talentId,
  sourceAuditionId: 'pipeline-a',
  sourceAuditionTitleSnapshot: 'E2E_TEST Casting Call',
  status: 'WATCHLIST',
  tags: ['Telugu speaker', 'theatre'],
  privateNote: 'Strong dialogue instincts for future roles.',
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
      setDoc(
        doc(db, 'users/talent-a/talentProfiles/talent-a'),
        {
          firstName: 'Maya',
          lastName: 'Rao',
          bio: 'Test profile',
          location: 'Hyderabad',
          category: 'ACTOR',
          experienceLevel: 'FRESHER',
          isPublic: true,
          publicProfileEnabled: false,
          talentVerificationStatus: 'not_submitted',
          verifiedAt: null,
        }
      ),
      setDoc(
        doc(db, 'users/talent-a/talentProfiles/talent-a/media/public-media'),
        {
          ownerId: 'talent-a',
          type: 'image',
          title: 'Public headshot',
          description: '',
          url: 'https://example.test/public.jpg',
          sortOrder: 0,
          isFeatured: true,
          visibility: 'public',
          moderationStatus: 'active',
        }
      ),
      setDoc(doc(db, 'publicTalentProfiles/maya-rao'), {
        uid: 'talent-a',
        slug: 'maya-rao',
        enabled: true,
        displayName: 'Maya Rao',
        category: 'ACTOR',
        experienceLevel: 'FRESHER',
        bio: 'Test profile',
        skills: [],
        languages: [],
        media: [],
      }),
      setDoc(doc(db, 'publicTalentProfiles/disabled-profile'), {
        uid: 'talent-b',
        slug: 'disabled-profile',
        enabled: false,
        displayName: 'Disabled Talent',
      }),
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
      setDoc(doc(db, 'conversations/visible-a__talent-a'), {
        applicationId: 'talent-a',
        auditionId: 'visible-a',
        recruiterId: 'recruiter-a',
        talentId: 'talent-a',
        participantIds: ['recruiter-a', 'talent-a'],
        participantRoles: {
          'recruiter-a': 'RECRUITER',
          'talent-a': 'TALENT',
        },
        titleSnapshot: 'E2E_TEST Casting Call',
        auditionTitleSnapshot: 'E2E_TEST Casting Call',
        talentNameSnapshot: 'Talent A',
        recruiterNameSnapshot: 'Recruiter A',
        applicationStatus: 'APPLIED',
        lastMessageText: '',
        unreadBy: ['recruiter-a', 'talent-a'],
        status: 'active',
        createdBy: 'recruiter-a',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      setDoc(
        doc(
          db,
          'conversations/visible-a__talent-a/messages/seed-message'
        ),
        {
          conversationId: 'visible-a__talent-a',
          senderId: 'recruiter-a',
          senderRole: 'RECRUITER',
          body: 'Please prepare scene two.',
          createdAt: new Date(),
          editedAt: null,
          deletedAt: null,
          moderationStatus: 'active',
          readBy: ['recruiter-a'],
          system: false,
          metadata: {},
        }
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

test('recruiter can manage their own private Talent Pool entry', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const path = 'recruiterTalentPool/recruiter-a__talent-a';

  await assertSucceeds(setDoc(doc(db, path), talentPoolEntry('recruiter-a', 'talent-a')));
  await assertSucceeds(getDoc(doc(db, path)));
  await assertSucceeds(
    updateDoc(doc(db, path), {
      status: 'FUTURE_FIT',
      tags: ['future fit', 'good diction'],
      privateNote: 'Revisit for future dialogue-heavy roles.',
      updatedAt: serverTimestamp(),
    })
  );
  await assertSucceeds(deleteDoc(doc(db, path)));
});

test('recruiter can create and replace exact safe Talent Pool entry from Decision Room', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const path = 'recruiterTalentPool/recruiter-a__talent-a';
  const ref = doc(db, path);

  await assertSucceeds(getDoc(ref));
  await assertSucceeds(
    setDoc(
      ref,
      talentPoolEntry('recruiter-a', 'talent-a', {
        status: 'SAVED',
        tags: ['Callback potential'],
        privateNote: 'Good timing.',
        sourceApplicationId: 'talent-a',
        sourceAuditionId: 'pipeline-a',
        sourceAuditionTitleSnapshot: 'E2E_TEST Casting Call',
      })
    )
  );
  await assertSucceeds(
    setDoc(
      ref,
      talentPoolEntry('recruiter-a', 'talent-a', {
        status: 'WATCHLIST',
        tags: ['Callback potential', 'Telugu speaker'],
        privateNote: 'Good timing. Revisit for weekend roles.',
        sourceApplicationId: 'talent-a',
        sourceAuditionId: 'pipeline-a',
        sourceAuditionTitleSnapshot: 'E2E_TEST Casting Call',
      })
    )
  );
});

test('Talent Pool entries are private to the owning recruiter', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'recruiterTalentPool/recruiter-a__talent-a'),
      talentPoolEntry('recruiter-a', 'talent-a')
    );
  });

  const ownerDb = environment.authenticatedContext('recruiter-a').firestore();
  const otherRecruiterDb = environment
    .authenticatedContext('recruiter-b')
    .firestore();
  const talentDb = environment.authenticatedContext('talent-a').firestore();
  const unauthDb = environment.unauthenticatedContext().firestore();
  const path = 'recruiterTalentPool/recruiter-a__talent-a';

  await assertSucceeds(getDoc(doc(ownerDb, path)));
  await assertFails(getDoc(doc(otherRecruiterDb, path)));
  await assertFails(getDoc(doc(talentDb, path)));
  await assertFails(getDoc(doc(unauthDb, path)));
});

test('recruiter cannot write another recruiter Talent Pool entry', async () => {
  const db = environment.authenticatedContext('recruiter-b').firestore();

  await assertFails(
    setDoc(
      doc(db, 'recruiterTalentPool/recruiter-a__talent-a'),
      talentPoolEntry('recruiter-a', 'talent-a')
    )
  );
});

test('Talent Pool rules reject invalid status and oversized fields', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();

  await assertFails(
    setDoc(
      doc(db, 'recruiterTalentPool/recruiter-a__talent-a'),
      talentPoolEntry('recruiter-a', 'talent-a', { status: 'SELECTED' })
    )
  );
  await assertFails(
    setDoc(
      doc(db, 'recruiterTalentPool/recruiter-a__talent-a'),
      talentPoolEntry('recruiter-a', 'talent-a', {
        tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      })
    )
  );
  await assertFails(
    setDoc(
      doc(db, 'recruiterTalentPool/recruiter-a__talent-a'),
      talentPoolEntry('recruiter-a', 'talent-a', {
        privateNote: 'x'.repeat(1001),
      })
    )
  );
});

test('conversation participants can read while non-participants cannot', async () => {
  const talentDb = environment.authenticatedContext('talent-a').firestore();
  const recruiterDb = environment
    .authenticatedContext('recruiter-a')
    .firestore();
  const outsiderDb = environment.authenticatedContext('talent-b').firestore();
  const path = 'conversations/visible-a__talent-a';
  await assertSucceeds(getDoc(doc(talentDb, path)));
  await assertSucceeds(getDoc(doc(recruiterDb, path)));
  await assertFails(getDoc(doc(outsiderDb, path)));
});

test('participant can create own message but cannot spoof sender or moderation', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const messages = collection(
    db,
    'conversations/visible-a__talent-a/messages'
  );
  await assertSucceeds(
    setDoc(doc(messages, 'talent-message'), {
      conversationId: 'visible-a__talent-a',
      senderId: 'talent-a',
      senderRole: 'TALENT',
      body: 'I will prepare the scene.',
      createdAt: serverTimestamp(),
      editedAt: null,
      deletedAt: null,
      moderationStatus: 'active',
      readBy: ['talent-a'],
      system: false,
      metadata: {},
    })
  );
  await assertFails(
    setDoc(doc(messages, 'spoofed-message'), {
      conversationId: 'visible-a__talent-a',
      senderId: 'recruiter-a',
      senderRole: 'RECRUITER',
      body: 'Spoofed',
      createdAt: serverTimestamp(),
      editedAt: null,
      deletedAt: null,
      moderationStatus: 'removed',
      readBy: ['talent-a'],
      system: false,
      metadata: {},
    })
  );
});

test('non-participant cannot create messages or edit conversation participants', async () => {
  const db = environment.authenticatedContext('talent-b').firestore();
  await assertFails(
    setDoc(
      doc(
        db,
        'conversations/visible-a__talent-a/messages/outsider-message'
      ),
      {
        conversationId: 'visible-a__talent-a',
        senderId: 'talent-b',
        senderRole: 'TALENT',
        body: 'Outsider',
        createdAt: serverTimestamp(),
        editedAt: null,
        deletedAt: null,
        moderationStatus: 'active',
        readBy: ['talent-b'],
        system: false,
        metadata: {},
      }
    )
  );
  await assertFails(
    updateDoc(doc(db, 'conversations/visible-a__talent-a'), {
      participantIds: ['talent-b'],
    })
  );
});

test('participant can mark own read state but cannot add outsiders', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertSucceeds(
    updateDoc(
      doc(
        db,
        'conversations/visible-a__talent-a/messages/seed-message'
      ),
      { readBy: ['recruiter-a', 'talent-a'] }
    )
  );
  await assertFails(
    updateDoc(
      doc(
        db,
        'conversations/visible-a__talent-a/messages/seed-message'
      ),
      { readBy: ['recruiter-a', 'talent-a', 'talent-b'] }
    )
  );
  await assertFails(
    updateDoc(
      doc(
        db,
        'conversations/visible-a__talent-a/messages/seed-message'
      ),
      { moderationStatus: 'removed' }
    )
  );
  await assertSucceeds(
    updateDoc(doc(db, 'conversations/visible-a__talent-a'), {
      unreadBy: ['recruiter-a'],
      updatedAt: serverTimestamp(),
    })
  );
  await assertFails(
    updateDoc(doc(db, 'conversations/visible-a__talent-a'), {
      unreadBy: [],
      updatedAt: serverTimestamp(),
    })
  );
});

test('anonymous users can read only enabled public Talent snapshots', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'publicTalentProfiles/maya-rao')));
  await assertFails(getDoc(doc(db, 'publicTalentProfiles/disabled-profile')));
  await assertFails(
    setDoc(doc(db, 'publicTalentProfiles/anonymous-write'), {
      enabled: true,
      displayName: 'Unsafe',
    })
  );
  await assertFails(
    getDoc(doc(db, 'users/talent-a/talentProfiles/talent-a'))
  );
});

test('Talent can save public display preferences but cannot forge publish state', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertSucceeds(
    updateDoc(doc(db, 'users/talent-a/talentProfiles/talent-a'), {
      publicShowLocation: true,
      publicShowSocialLinks: true,
    })
  );
  await assertFails(
    updateDoc(doc(db, 'users/talent-a/talentProfiles/talent-a'), {
      publicProfileEnabled: true,
      publicSlug: 'maya-rao',
    })
  );
  await assertFails(
    updateDoc(doc(db, 'users/talent-b/talentProfiles/talent-b'), {
      publicProfileEnabled: true,
    })
  );
  await assertFails(
    updateDoc(doc(db, 'publicTalentProfiles/maya-rao'), {
      displayName: 'Client overwrite',
    })
  );
});

test('anonymous users can read only active media marked public', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDoc(
      doc(
        db,
        'users/talent-a/talentProfiles/talent-a/media/public-media'
      )
    )
  );
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

test('Talent cannot read draft auditions owned by a recruiter', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'auditions/draft-a'),
      audition('recruiter-a', { status: 'DRAFT' })
    );
  });
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertFails(getDoc(doc(db, 'auditions/draft-a')));
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

test('Storage keeps recruiter verification evidence private to owner and admins', async () => {
  const recruiterStorage = environment
    .authenticatedContext('recruiter-a')
    .storage();
  const otherRecruiterStorage = environment
    .authenticatedContext('recruiter-b')
    .storage();
  const adminStorage = environment
    .authenticatedContext('admin-a', { admin: true })
    .storage();
  const evidencePath =
    'recruiter-verification-evidence/recruiter-a/evidence-a/proof.pdf';
  await assertSucceeds(
    uploadBytes(
      storageRef(recruiterStorage, evidencePath),
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'application/pdf',
        customMetadata: {
          ownerId: 'recruiter-a',
          visibility: 'private_verification',
          uploadKind: 'recruiter_verification_evidence',
        },
      }
    )
  );
  await assertSucceeds(getBytes(storageRef(recruiterStorage, evidencePath)));
  await assertSucceeds(getBytes(storageRef(adminStorage, evidencePath)));
  await assertFails(getBytes(storageRef(otherRecruiterStorage, evidencePath)));
  await assertFails(
    uploadBytes(
      storageRef(
        otherRecruiterStorage,
        'recruiter-verification-evidence/recruiter-a/evidence-b/forged.pdf'
      ),
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'application/pdf',
        customMetadata: {
          ownerId: 'recruiter-a',
          visibility: 'private_verification',
          uploadKind: 'recruiter_verification_evidence',
        },
      }
    )
  );
});

test('Storage rejects Talent PDF uploads but accepts Recruiter evidence PDFs', async () => {
  const talentStorage = environment.authenticatedContext('talent-a').storage();
  const recruiterStorage = environment
    .authenticatedContext('recruiter-a')
    .storage();
  await assertFails(
    uploadBytes(
      storageRef(talentStorage, 'talent-media/talent-a/portfolio/doc-a/doc-a.pdf'),
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'application/pdf',
        customMetadata: {
          ownerId: 'talent-a',
          visibility: 'recruiters',
          mediaKind: 'portfolio',
        },
      }
    )
  );
  await assertSucceeds(
    uploadBytes(
      storageRef(
        recruiterStorage,
        'recruiter-verification-evidence/recruiter-a/evidence-c/proof.pdf'
      ),
      new Uint8Array([1, 2, 3]),
      {
        contentType: 'application/pdf',
        customMetadata: {
          ownerId: 'recruiter-a',
          visibility: 'private_verification',
          uploadKind: 'recruiter_verification_evidence',
        },
      }
    )
  );
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

test('Talent can save and unsave their own active audition', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const ref = doc(db, 'users/talent-a/savedAuditions/visible-a');
  await assertSucceeds(
    setDoc(ref, {
      auditionId: 'visible-a',
      savedAt: serverTimestamp(),
      titleSnapshot: 'E2E_TEST Casting Call',
      recruiterId: 'recruiter-a',
      deadlineSnapshot: new Date(Date.now() + 86_400_000),
    })
  );
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(deleteDoc(ref));
});

test('Talent cannot save an audition under another user', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertFails(
    setDoc(doc(db, 'users/talent-b/savedAuditions/visible-a'), {
      auditionId: 'visible-a',
      savedAt: serverTimestamp(),
      titleSnapshot: 'Forged',
      recruiterId: 'recruiter-a',
      deadlineSnapshot: new Date(Date.now() + 86_400_000),
    })
  );
});

test('signed-out users cannot save auditions', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(
    setDoc(doc(db, 'users/talent-a/savedAuditions/visible-a'), {
      auditionId: 'visible-a',
      savedAt: serverTimestamp(),
    })
  );
});

test('Recruiters cannot read Talent saved auditions', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        'users/talent-a/savedAuditions/visible-a'
      ),
      { auditionId: 'visible-a' }
    );
  });
  const db = environment.authenticatedContext('recruiter-a').firestore();
  await assertFails(
    getDoc(doc(db, 'users/talent-a/savedAuditions/visible-a'))
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

test('Audition lifecycle updates require valid statuses and visible briefs', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  await assertSucceeds(
    updateDoc(doc(db, 'auditions/visible-a'), { status: 'CLOSED' })
  );
  await assertSucceeds(
    updateDoc(doc(db, 'auditions/visible-a'), { status: 'ACTIVE' })
  );
  await assertFails(
    updateDoc(doc(db, 'auditions/visible-a'), { status: 'ARCHIVED' })
  );
  await assertFails(
    updateDoc(doc(db, 'auditions/removed-a'), { status: 'ACTIVE' })
  );
});

test('Audition lifecycle edits cannot change applicant counts or moderation fields', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  await assertFails(
    updateDoc(doc(db, 'auditions/visible-a'), { applicantCount: 99 })
  );
  await assertFails(
    updateDoc(doc(db, 'auditions/visible-a'), {
      moderationStatus: 'REMOVED',
    })
  );
});

test('Audition create rejects more than 8 screening questions', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const tooManyQuestions = Array.from({ length: 9 }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i + 1}`,
    type: 'yes_no',
    required: false,
    order: i,
  }));
  await assertFails(
    setDoc(
      doc(db, 'auditions/recruiter-a-sq-over'),
      audition('recruiter-a', { screeningQuestions: tooManyQuestions })
    )
  );
});

test('Audition create allows up to 8 screening questions', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const questions = Array.from({ length: 8 }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i + 1}`,
    type: 'yes_no',
    required: false,
    order: i,
  }));
  await assertSucceeds(
    setDoc(
      doc(db, 'auditions/recruiter-a-sq-max'),
      audition('recruiter-a', { screeningQuestions: questions })
    )
  );
});

test('Audition update rejects more than 8 screening questions', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const tooManyQuestions = Array.from({ length: 9 }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i + 1}`,
    type: 'yes_no',
    required: false,
    order: i,
  }));
  await assertFails(
    updateDoc(doc(db, 'auditions/visible-a'), { screeningQuestions: tooManyQuestions })
  );
});

test('Audition update allows up to 8 screening questions', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const questions = Array.from({ length: 4 }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i + 1}`,
    type: 'yes_no',
    required: false,
    order: i,
  }));
  await assertSucceeds(
    updateDoc(doc(db, 'auditions/visible-a'), { screeningQuestions: questions })
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

const validClientReport = (reporterId = 'talent-a') => ({
  targetType: 'audition',
  targetId: 'visible-a',
  targetKey: 'audition:visible-a',
  targetOwnerId: 'recruiter-a',
  reporterId,
  reporterRole: 'TALENT',
  reasonCode: 'misleading_information',
  reasonText: 'The casting brief appears misleading.',
  status: 'open',
  priority: 'low',
  evidenceSnapshots: {},
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  reviewedBy: null,
  reviewedAt: null,
  resolutionAction: null,
  resolutionNote: null,
  adminOnlyNotes: null,
});

test('authenticated users can create only their own safe report submission', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  await assertSucceeds(
    setDoc(doc(db, 'reports/client-report'), validClientReport())
  );
  await assertFails(
    setDoc(
      doc(db, 'reports/spoofed-report'),
      validClientReport('talent-b')
    )
  );
  await assertFails(
    setDoc(doc(db, 'reports/admin-fields-report'), {
      ...validClientReport(),
      status: 'resolved',
      reviewedBy: 'talent-a',
      adminOnlyNotes: 'forged',
    })
  );
});

test('reports are private from reporters, targets, and unrelated users', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'reports/private-report'), {
      ...validClientReport(),
      evidenceSnapshots: { title: 'Safe title' },
    });
  });
  const reporterDb = environment.authenticatedContext('talent-a').firestore();
  const targetDb = environment.authenticatedContext('recruiter-a').firestore();
  const outsiderDb = environment.authenticatedContext('talent-b').firestore();
  await assertFails(getDoc(doc(reporterDb, 'reports/private-report')));
  await assertFails(getDoc(doc(targetDb, 'reports/private-report')));
  await assertFails(getDoc(doc(outsiderDb, 'reports/private-report')));
});

test('admins can read and update reports and control report events', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'reports/admin-report'), {
      ...validClientReport(),
      evidenceSnapshots: { title: 'Safe title' },
    });
  });
  const adminDb = environment
    .authenticatedContext('admin-a', { admin: true })
    .firestore();
  const userDb = environment.authenticatedContext('talent-a').firestore();
  await assertSucceeds(getDoc(doc(adminDb, 'reports/admin-report')));
  await assertSucceeds(
    updateDoc(doc(adminDb, 'reports/admin-report'), {
      status: 'under_review',
      reviewedBy: 'admin-a',
    })
  );
  await assertSucceeds(
    setDoc(doc(adminDb, 'reports/admin-report/events/event-a'), {
      actorId: 'admin-a',
      actorRole: 'ADMIN',
      action: 'review_report',
      note: '',
      createdAt: serverTimestamp(),
    })
  );
  await assertFails(
    setDoc(doc(userDb, 'reports/admin-report/events/forged'), {
      actorId: 'talent-a',
      action: 'resolve_report',
    })
  );
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

test('Talent can query own applications using the tracker collection group pattern', async () => {
  const db = environment.authenticatedContext('talent-a').firestore();
  const applicationsQuery = query(
    collectionGroup(db, 'applications'),
    where('talentId', '==', 'talent-a'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await assertSucceeds(getDocs(applicationsQuery));
  assert.equal(snapshot.docs.length, 1);
  assert.equal(snapshot.docs[0].id, 'talent-a');
});

test('Talent cannot query another Talent application through collection group', async () => {
  const db = environment.authenticatedContext('talent-b').firestore();
  const applicationsQuery = query(
    collectionGroup(db, 'applications'),
    where('talentId', '==', 'talent-a'),
    orderBy('createdAt', 'desc')
  );

  await assertFails(getDocs(applicationsQuery));
});

test('audition owner can update allowed recruiter pipeline fields', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const ref = doc(db, 'auditions/pipeline-a/applications/talent-a');
  await assertSucceeds(
    updateDoc(ref, {
      status: 'CALLBACK',
      recruiterStatus: 'CALLBACK',
      statusUpdatedBy: 'recruiter-a',
      statusUpdatedAt: serverTimestamp(),
      lastRecruiterActionAt: serverTimestamp(),
      recruiterNote: 'Strong screen presence',
      recruiterRating: 4,
      internalTags: ['callback'],
      talentNextStepNote: 'Please prepare the second scene for callback.',
      updatedAt: serverTimestamp(),
    })
  );
});

test('application review rules reject oversized Talent-visible notes', async () => {
  const db = environment.authenticatedContext('recruiter-a').firestore();
  const ref = doc(db, 'auditions/pipeline-a/applications/talent-a');
  await assertFails(
    updateDoc(ref, {
      talentNextStepNote: 'x'.repeat(401),
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
