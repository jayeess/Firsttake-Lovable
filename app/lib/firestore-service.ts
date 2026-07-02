import {
  doc,
  setDoc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  runTransaction,
  QueryConstraint,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { getFirebaseAuth } from './firebase';
import { getErrorMessage } from './error-utils';
import type {
  Application,
  ApplicationStatus,
  AuditionApplicant,
  Audition,
  AuditionType,
  ExperienceLevel,
  RecruiterProfile,
  RecruiterTalentPoolEntry,
  ScreeningAnswer,
  ScreeningQuestion,
  TalentCategory,
  TalentProfile,
  TalentMedia,
  TalentMediaType,
  TalentMediaVisibility,
  TalentVerification,
  UserType,
  RecruiterVerification,
  SavedAudition,
  TalentPoolStatus,
  WorkMode,
  PaymentType,
  NotificationPreferences,
} from './types';
import type { RecruiterReviewInput } from './application-pipeline';
import { calculateTalentProfileCompleteness } from './profile-completeness';
import { buildAuditionSearchFields } from './audition-discovery';
import { normalizeNotificationPreferences } from './notification-preferences';
import { validateTalentPoolEntryInput } from './recruiter-talent-pool-policy';

export interface UserAccount {
  uid: string;
  email: string | null;
  userType: Exclude<UserType, 'ADMIN'>;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  notificationPreferences?: NotificationPreferences;
}

export const getUserNotificationPreferences = async (uid: string) => {
  const snapshot = await getDoc(doc(getFirestoreDb(), 'users', uid));
  return normalizeNotificationPreferences(
    snapshot.data()?.notificationPreferences as NotificationPreferences | undefined
  );
};

export const updateUserNotificationPreferences = async (
  uid: string,
  preferences: NotificationPreferences
) => {
  await updateDoc(doc(getFirestoreDb(), 'users', uid), {
    notificationPreferences: normalizeNotificationPreferences(preferences),
    updatedAt: new Date(),
  });
};

export const ensureUserAccount = async (
  uid: string,
  email: string | null,
  userType: Exclude<UserType, 'ADMIN'>
) => {
  try {
    const userRef = doc(getFirestoreDb(), 'users', uid);
    const snapshot = await getDoc(userRef);
    const accountData = {
      uid,
      email,
      userType,
      emailVerified: false,
      phoneVerified: false,
      accountStatus: 'ACTIVE',
      isAdmin: false,
      updatedAt: new Date(),
    };

    if (!snapshot.exists()) {
      await setDoc(
        userRef,
        {
          ...accountData,
          createdAt: new Date(),
        },
        { merge: true }
      );
      return;
    }

    const existingUserType = snapshot.data().userType;
    if (existingUserType !== 'TALENT' && existingUserType !== 'RECRUITER') {
      // Older login code could create a document containing only lastLogin.
      // Recreate that incomplete parent record with the role chosen at signup.
      await deleteDoc(userRef);
      await setDoc(userRef, {
        ...accountData,
        createdAt: snapshot.data().createdAt ?? new Date(),
      });
      return;
    }

    if (existingUserType !== userType) {
      throw new Error(
        `This account is registered as ${existingUserType.toLowerCase()}, not ${userType.toLowerCase()}.`
      );
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to prepare user account'));
  }
};

export const getUserAccount = async (
  uid: string
): Promise<UserAccount | null> => {
  try {
    const userDoc = await getDoc(doc(getFirestoreDb(), 'users', uid));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    if (data.userType !== 'TALENT' && data.userType !== 'RECRUITER') {
      return null;
    }

    return {
      uid,
      email: typeof data.email === 'string' ? data.email : null,
      userType: data.userType,
      accountStatus: data.accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load user account'));
  }
};

export const getRecruiterVerification = async (
  uid: string
): Promise<RecruiterVerification | null> => {
  const snapshot = await getDoc(
    doc(getFirestoreDb(), 'recruiterVerifications', uid)
  );
  return snapshot.exists()
    ? (snapshot.data() as RecruiterVerification)
    : null;
};

export const submitRecruiterVerification = async (
  uid: string,
  email: string | null,
  data: Omit<
    RecruiterVerification,
    | 'recruiterId'
    | 'recruiterEmail'
    | 'status'
    | 'adminNote'
    | 'reviewedBy'
    | 'submittedAt'
    | 'reviewedAt'
    | 'updatedAt'
  >
) => {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== uid) throw new Error('Please sign in again.');
  const response = await fetch('/api/recruiter/verification', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, recruiterEmail: email }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to submit verification.');
  }
};

// ==================== TALENT PROFILE ====================

export const createTalentProfile = async (
  uid: string,
  profileData: TalentProfile
) => {
  try {
    const profileRef = doc(
      getFirestoreDb(),
      'users',
      uid,
      'talentProfiles',
      uid
    );
    const existing = await getDoc(profileRef);
    const completeness = calculateTalentProfileCompleteness(profileData);
    await setDoc(
      profileRef,
      {
        ...profileData,
        profileCompletenessScore: completeness.score,
        profileCompletenessChecklist: completeness.checklist,
        talentVerificationStatus:
          existing.data()?.talentVerificationStatus ?? 'not_submitted',
        ...(existing.exists() ? {} : { createdAt: new Date() }),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to create talent profile'));
  }
};

export const getTalentProfile = async (
  uid: string
): Promise<TalentProfile | null> => {
  try {
    const profileDoc = await getDoc(
      doc(getFirestoreDb(), 'users', uid, 'talentProfiles', uid)
    );
    if (!profileDoc.exists()) return null;
    const profile = profileDoc.data() as TalentProfile;
    const completeness = calculateTalentProfileCompleteness(profile);
    return {
      ...profile,
      profileCompletenessScore: completeness.score,
      profileCompletenessChecklist: completeness.checklist,
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load talent profile'));
  }
};

export const updateTalentProfile = async (
  uid: string,
  updates: UpdateData<DocumentData>
) => {
  try {
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'talentProfiles', uid), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update talent profile'));
  }
};

// ==================== RECRUITER PROFILE ====================

export const createRecruiterProfile = async (
  uid: string,
  profileData: RecruiterProfile
) => {
  try {
    const profileRef = doc(
      getFirestoreDb(),
      'users',
      uid,
      'recruiterProfiles',
      uid
    );
    const existingProfile = await getDoc(profileRef);
    const isVerified = existingProfile.exists()
      ? existingProfile.data().isVerified === true
      : false;

    await setDoc(profileRef, {
      ...profileData,
      isVerified,
      ...(existingProfile.exists() ? {} : { createdAt: new Date() }),
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to create recruiter profile'));
  }
};

export const getRecruiterProfile = async (
  uid: string
): Promise<RecruiterProfile | null> => {
  try {
    const profileDoc = await getDoc(
      doc(getFirestoreDb(), 'users', uid, 'recruiterProfiles', uid)
    );
    return profileDoc.exists()
      ? (profileDoc.data() as RecruiterProfile)
      : null;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load recruiter profile'));
  }
};

export const updateRecruiterProfile = async (
  uid: string,
  updates: UpdateData<DocumentData>
) => {
  try {
    await updateDoc(doc(getFirestoreDb(), 'users', uid, 'recruiterProfiles', uid), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update recruiter profile'));
  }
};

// ==================== AUDITIONS ====================

export const createAudition = async (
  recruiterId: string,
  auditionData: {
    recruiterName?: string;
    title: string;
    description: string;
    category: TalentCategory;
    experienceLevel: ExperienceLevel;
    location: string;
    duration: string;
    requirements: string;
    numberOfPositions: number;
    payInfo?: string;
    languages?: string[];
    auditionType?: AuditionType;
    workMode?: WorkMode;
    paymentType?: PaymentType;
    selfTapeEnabled?: boolean;
    selfTapeRequired?: boolean;
    selfTapeInstructions?: string;
    selfTapeSubmissionTypes?: Array<'upload' | 'link'>;
    selfTapeMaxDurationSeconds?: number | null;
    screeningQuestions?: ScreeningQuestion[];
    deadline: Date;
    status: 'ACTIVE' | 'DRAFT';
  }
) => {
  try {
    const account = await getUserAccount(recruiterId);
    if (account?.userType !== 'RECRUITER') {
      throw new Error('Only recruiter accounts can create auditions.');
    }
    if (account.accountStatus === 'SUSPENDED') {
      throw new Error('This recruiter account is suspended.');
    }

    const verification = await getRecruiterVerification(recruiterId);
    if (verification?.status !== 'approved') {
      throw new Error('Recruiter verification approval is required.');
    }

    const docRef = await addDoc(collection(getFirestoreDb(), 'auditions'), {
      recruiterId,
      ...auditionData,
      ...buildAuditionSearchFields(auditionData),
      applicantCount: 0,
      moderationStatus: 'VISIBLE',
      recruiterVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (auditionData.status === 'ACTIVE') {
      const user = getFirebaseAuth().currentUser;
      if (user?.uid === recruiterId) {
        await fetch('/api/auditions/published', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auditionId: docRef.id }),
        }).catch(() => undefined);
      }
    }
    return docRef.id;
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to create audition');
    if (message.includes('permission-denied')) {
      throw new Error(
        'Your recruiter account is ready, but posting is not available for this session. Refresh, sign in again, and contact support if it continues.'
      );
    }
    throw new Error(message);
  }
};

const talentMediaCollection = (uid: string) =>
  collection(
    getFirestoreDb(),
    'users',
    uid,
    'talentProfiles',
    uid,
    'media'
  );

export const createTalentMediaId = (uid: string) =>
  doc(talentMediaCollection(uid)).id;

export const getTalentMedia = async (
  uid: string,
  recruiterVisibleOnly = false
): Promise<TalentMedia[]> => {
  const constraints: QueryConstraint[] = recruiterVisibleOnly
    ? [
        where('moderationStatus', '==', 'active'),
        where('visibility', 'in', ['recruiters', 'public']),
      ]
    : [];
  const snapshot = await getDocs(
    query(talentMediaCollection(uid), ...constraints)
  );
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }) as TalentMedia)
    .sort((first, second) => first.sortOrder - second.sortOrder);
};

export const saveTalentMedia = async (
  uid: string,
  mediaId: string,
  input: {
    type: TalentMediaType;
    title: string;
    description?: string;
    url?: string;
    storagePath?: string;
    externalUrl?: string;
    mimeType?: string;
    sizeBytes?: number;
    visibility?: TalentMediaVisibility;
  }
) => {
  const db = getFirestoreDb();
  const profileRef = doc(db, 'users', uid, 'talentProfiles', uid);
  const mediaRef = doc(talentMediaCollection(uid), mediaId);
  await runTransaction(db, async (transaction) => {
    const profile = await transaction.get(profileRef);
    const count = Number(profile.data()?.portfolioMediaCount ?? 0);
    transaction.set(mediaRef, {
      ownerId: uid,
      type: input.type,
      title: input.title.trim().slice(0, 120),
      description: input.description?.trim().slice(0, 1000) ?? '',
      url: input.url ?? '',
      storagePath: input.storagePath ?? '',
      thumbnailUrl: input.type === 'image' ? input.url ?? '' : '',
      externalUrl: input.externalUrl ?? '',
      mimeType: input.mimeType ?? '',
      sizeBytes: input.sizeBytes ?? 0,
      sortOrder: count,
      isFeatured: count === 0,
      visibility: input.visibility ?? 'recruiters',
      moderationStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    transaction.set(
      profileRef,
      {
        portfolioMediaCount: count + 1,
        featuredMediaId:
          profile.data()?.featuredMediaId || (count === 0 ? mediaId : ''),
        mediaUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  });
};

export const updateTalentMedia = async (
  uid: string,
  mediaId: string,
  updates: Pick<TalentMedia, 'title' | 'description' | 'visibility'>
) => {
  await updateDoc(doc(talentMediaCollection(uid), mediaId), {
    title: updates.title.trim().slice(0, 120),
    description: updates.description.trim().slice(0, 1000),
    visibility: updates.visibility,
    updatedAt: new Date(),
  });
};

export const setFeaturedTalentMedia = async (
  uid: string,
  mediaId: string
) => {
  const db = getFirestoreDb();
  const profileRef = doc(db, 'users', uid, 'talentProfiles', uid);
  const mediaSnapshot = await getDocs(talentMediaCollection(uid));
  const batchUpdates = mediaSnapshot.docs.map((item) =>
    updateDoc(item.ref, {
      isFeatured: item.id === mediaId,
      updatedAt: new Date(),
    })
  );
  await Promise.all([
    ...batchUpdates,
    updateDoc(profileRef, {
      featuredMediaId: mediaId,
      mediaUpdatedAt: new Date(),
      updatedAt: new Date(),
    }),
  ]);
};

export const removeTalentMedia = async (
  uid: string,
  mediaId: string
) => {
  const db = getFirestoreDb();
  const profileRef = doc(db, 'users', uid, 'talentProfiles', uid);
  const mediaRef = doc(talentMediaCollection(uid), mediaId);
  await runTransaction(db, async (transaction) => {
    const [profile, media] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(mediaRef),
    ]);
    if (!media.exists()) return;
    const count = Math.max(
      0,
      Number(profile.data()?.portfolioMediaCount ?? 1) - 1
    );
    transaction.delete(mediaRef);
    transaction.update(profileRef, {
      portfolioMediaCount: count,
      featuredMediaId:
        profile.data()?.featuredMediaId === mediaId
          ? ''
          : profile.data()?.featuredMediaId ?? '',
      mediaUpdatedAt: new Date(),
      updatedAt: new Date(),
    });
  });
};

export const updateTalentProfilePhoto = async (
  uid: string,
  photo?: { url: string; storagePath: string }
) => {
  await updateDoc(doc(getFirestoreDb(), 'users', uid, 'talentProfiles', uid), {
    profilePhotoUrl: photo?.url ?? '',
    profilePhotoPath: photo?.storagePath ?? '',
    mediaUpdatedAt: new Date(),
    updatedAt: new Date(),
  });
};

export const getTalentVerification = async (
  uid: string
): Promise<TalentVerification | null> => {
  const snapshot = await getDoc(
    doc(getFirestoreDb(), 'talentVerifications', uid)
  );
  return snapshot.exists() ? (snapshot.data() as TalentVerification) : null;
};

export const submitTalentVerification = async (uid: string) => {
  const user = getFirebaseAuth().currentUser;
  if (!user || user.uid !== uid) throw new Error('Please sign in again.');
  const response = await fetch('/api/talent/verification', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to submit talent verification.');
  }
};

export const getAuditions = async (
  constraints: QueryConstraint[] = []
): Promise<Audition[]> => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions'),
      where('status', '==', 'ACTIVE'),
      where('moderationStatus', '==', 'VISIBLE'),
      ...constraints
    );
    const querySnapshot = await getDocs(q);
    const auditions = querySnapshot.docs
      .map(
        (snapshot) =>
          ({
            id: snapshot.id,
            ...snapshot.data(),
          }) as Audition
      )
      .filter((audition) => audition.moderationStatus !== 'REMOVED');
    return Promise.all(auditions.map(addRecruiterTrust));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load auditions'));
  }
};

export const getAuditionById = async (
  auditionId: string
): Promise<Audition | null> => {
  try {
    const auditionDoc = await getDoc(doc(getFirestoreDb(), 'auditions', auditionId));
    if (!auditionDoc.exists()) return null;
    return addRecruiterTrust({
      id: auditionDoc.id,
      ...auditionDoc.data(),
    } as Audition);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load audition'));
  }
};

export const getRecruiterAuditions = async (
  recruiterId: string
): Promise<Audition[]> => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions'),
      where('recruiterId', '==', recruiterId)
    );
    const querySnapshot = await getDocs(q);
    return Promise.all(
      querySnapshot.docs.map(async (snapshot) => {
        const applicationsSnapshot = await getDocs(
          collection(getFirestoreDb(), 'auditions', snapshot.id, 'applications')
        );

        return {
          id: snapshot.id,
          ...snapshot.data(),
          applicantCount: applicationsSnapshot.size,
        } as Audition;
      })
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load recruiter auditions'));
  }
};

export const updateAudition = async (
  auditionId: string,
  updates: UpdateData<DocumentData>
) => {
  try {
    await updateDoc(doc(getFirestoreDb(), 'auditions', auditionId), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update audition'));
  }
};

export const deleteAudition = async (auditionId: string) => {
  try {
    await deleteDoc(doc(getFirestoreDb(), 'auditions', auditionId));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to delete audition'));
  }
};

// ==================== APPLICATIONS ====================

export const submitApplication = async (
  auditionId: string,
  talentId: string,
  coverMessage?: string,
  screeningAnswers?: ScreeningAnswer[]
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user || user.uid !== talentId) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auditionId, coverMessage, screeningAnswers }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to submit application');
    }
    return talentId;
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to submit application');
    if (
      message.includes('permission') ||
      message.includes('permission-denied')
    ) {
      throw new Error(
        'We could not confirm this account as Talent. Log out, log in again, and retry. Contact support if it continues.'
      );
    }
    throw new Error(message);
  }
};

export const getSavedAuditions = async (
  talentId: string
): Promise<SavedAudition[]> => {
  try {
    const snapshot = await getDocs(
      collection(getFirestoreDb(), 'users', talentId, 'savedAuditions')
    );
    return snapshot.docs.map((item) => item.data() as SavedAudition);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load saved auditions'));
  }
};

export const setAuditionSaved = async (
  auditionId: string,
  saved: boolean
) => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  const response = await fetch('/api/auditions/save', {
    method: saved ? 'POST' : 'DELETE',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ auditionId }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to update saved auditions');
  }
};

export type SaveTalentToPoolInput = {
  talentId: string;
  talentNameSnapshot: string;
  talentPublicSlug?: string;
  talentCategorySnapshot?: string;
  sourceApplicationId?: string;
  sourceAuditionId?: string;
  sourceAuditionTitleSnapshot?: string;
  status: TalentPoolStatus;
  tags?: string[] | string;
  privateNote?: string;
  existingCreatedAt?: RecruiterTalentPoolEntry['createdAt'];
};

export type UpdateTalentPoolEntryInput = {
  status?: TalentPoolStatus;
  tags?: string[] | string;
  privateNote?: string;
};

export const getRecruiterTalentPoolEntryId = (
  recruiterId: string,
  talentId: string
) => `${recruiterId}__${talentId}`;

const talentPoolUpdatedAt = (entry: RecruiterTalentPoolEntry) => {
  const value = entry.updatedAt ?? entry.createdAt;
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') return new Date(value).getTime();
  return value.toMillis();
};

export const saveTalentToPool = async (
  input: SaveTalentToPoolInput
): Promise<RecruiterTalentPoolEntry> => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user || !user.uid || !input.talentId || !input.talentNameSnapshot.trim()) {
      throw new Error('Missing Talent or recruiter context. Refresh and try again.');
    }

    const validated = validateTalentPoolEntryInput(input);
    const entryId = getRecruiterTalentPoolEntryId(user.uid, input.talentId);
    const entryRef = doc(getFirestoreDb(), 'recruiterTalentPool', entryId);
    const now = new Date();
    const entry: RecruiterTalentPoolEntry = {
      id: entryId,
      recruiterId: user.uid,
      talentId: input.talentId,
      talentNameSnapshot: input.talentNameSnapshot,
      ...(input.talentPublicSlug
        ? { talentPublicSlug: input.talentPublicSlug }
        : {}),
      ...(input.talentCategorySnapshot
        ? { talentCategorySnapshot: input.talentCategorySnapshot }
        : {}),
      ...(input.sourceApplicationId
        ? { sourceApplicationId: input.sourceApplicationId }
        : {}),
      ...(input.sourceAuditionId
        ? { sourceAuditionId: input.sourceAuditionId }
        : {}),
      ...(input.sourceAuditionTitleSnapshot
        ? { sourceAuditionTitleSnapshot: input.sourceAuditionTitleSnapshot }
        : {}),
      status: validated.status,
      tags: validated.tags,
      privateNote: validated.privateNote,
      createdAt: input.existingCreatedAt ?? now,
      updatedAt: now,
    };

    await setDoc(entryRef, entry);
    return entry;
  } catch (error: unknown) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    const message = error instanceof Error ? error.message : '';
    if (code.includes('permission-denied') || message.toLowerCase().includes('permission')) {
      throw new Error('Permission denied while saving Talent Pool entry.');
    }
    if (message) throw new Error(message);
    throw new Error('Could not save Talent Pool entry. Please refresh and try again.');
  }
};

export const getRecruiterTalentPool = async (
  recruiterId?: string
): Promise<RecruiterTalentPoolEntry[]> => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Please sign in again.');
    if (recruiterId && recruiterId !== user.uid) {
      throw new Error('You can only open your own Talent Pool.');
    }

    const poolQuery = query(
      collection(getFirestoreDb(), 'recruiterTalentPool'),
      where('recruiterId', '==', user.uid)
    );
    const snapshot = await getDocs(poolQuery);
    return snapshot.docs
      .map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as RecruiterTalentPoolEntry
      )
      .sort((first, second) => talentPoolUpdatedAt(second) - talentPoolUpdatedAt(first));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load Talent Pool'));
  }
};

export const getTalentPoolEntryForTalent = async (
  talentId: string
): Promise<RecruiterTalentPoolEntry | null> => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Please sign in again.');
    const entryId = getRecruiterTalentPoolEntryId(user.uid, talentId);
    const snapshot = await getDoc(
      doc(getFirestoreDb(), 'recruiterTalentPool', entryId)
    );
    if (!snapshot.exists()) return null;
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as RecruiterTalentPoolEntry;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load Talent Pool entry'));
  }
};

export const updateTalentPoolEntry = async (
  entryId: string,
  patch: UpdateTalentPoolEntryInput
) => {
  try {
    const current = await getDoc(
      doc(getFirestoreDb(), 'recruiterTalentPool', entryId)
    );
    if (!current.exists()) throw new Error('Talent Pool entry was not found.');
    const existing = current.data() as RecruiterTalentPoolEntry;
    const validated = validateTalentPoolEntryInput({
      status: patch.status ?? existing.status,
      tags: patch.tags ?? existing.tags,
      privateNote: patch.privateNote ?? existing.privateNote ?? '',
    });

    await updateDoc(doc(getFirestoreDb(), 'recruiterTalentPool', entryId), {
      status: validated.status,
      tags: validated.tags,
      privateNote: validated.privateNote,
      updatedAt: new Date(),
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update Talent Pool entry'));
  }
};

export const removeTalentPoolEntry = async (entryId: string) => {
  try {
    await deleteDoc(doc(getFirestoreDb(), 'recruiterTalentPool', entryId));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to remove Talent Pool entry'));
  }
};

const addRecruiterTrust = async (audition: Audition): Promise<Audition> => {
  const verification = await getRecruiterVerification(audition.recruiterId).catch(
    () => null
  );
  return {
    ...audition,
    recruiterVerified: verification?.status === 'approved',
  };
};

export const getTalentApplications = async (
  talentId: string
): Promise<Application[]> => {
  try {
    const applicationsQuery = query(
      collectionGroup(getFirestoreDb(), 'applications'),
      where('talentId', '==', talentId),
      orderBy('createdAt', 'desc')
    );
    const applicationSnapshot = await getDocs(applicationsQuery);

    const applicationResults = await Promise.all(
      applicationSnapshot.docs.map(async (applicationDoc) => {
        const auditionId = applicationDoc.ref.parent.parent?.id;
        if (!auditionId) {
          return null;
        }

        return {
          id: applicationDoc.id,
          auditionId,
          audition: await getAuditionById(auditionId).catch(() => null),
          ...applicationDoc.data(),
        } as Application;
      })
    );

    return applicationResults.filter(
      (application): application is Application => application !== null
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load talent applications'));
  }
};

export const getAuditionApplications = async (
  auditionId: string
): Promise<Application[]> => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions', auditionId, 'applications')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (applicationDoc) =>
        ({
          id: applicationDoc.id,
          auditionId,
          ...applicationDoc.data(),
        }) as Application
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load audition applications'));
  }
};

export const getTalentApplicationForAudition = async (
  auditionId: string,
  talentId: string
): Promise<Application | null> => {
  const db = getFirestoreDb();
  const ref = doc(db, 'auditions', auditionId, 'applications', talentId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const audition = await getAuditionById(auditionId);
  return {
    id: snapshot.id,
    auditionId,
    audition,
    ...snapshot.data(),
  } as Application;
};

export const updateApplicationStatus = async (
  auditionId: string,
  applicationId: string,
  newStatus: ApplicationStatus,
  recruiterNote?: string,
  rejectionReason?: string
) => {
  return updateApplicationReview(auditionId, applicationId, {
    status: newStatus,
    recruiterNote,
  }, rejectionReason);
};

export const updateApplicationReview = async (
  auditionId: string,
  applicationId: string,
  review: RecruiterReviewInput,
  rejectionReason?: string
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auditionId,
        applicationId,
        ...review,
        rejectionReason,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to update application status');
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update application status'));
  }
};

export const submitSelfTapeLink = async (
  auditionId: string,
  applicationId: string,
  url: string
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user || user.uid !== applicationId) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications/self-tape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auditionId, url }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to submit self-tape');
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to submit self-tape'));
  }
};

export const removeSelfTape = async (
  auditionId: string,
  applicationId: string
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user || user.uid !== applicationId) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications/self-tape', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auditionId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to remove self-tape');
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to remove self-tape'));
  }
};

export const markSelfTapeReviewed = async (
  auditionId: string,
  applicationId: string
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications/self-tape', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auditionId, applicationId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to mark self-tape reviewed');
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to mark self-tape reviewed'));
  }
};

export const deleteApplication = async (
  auditionId: string,
  applicationId: string
) => {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user || user.uid !== applicationId) throw new Error('Please sign in again.');
    const response = await fetch('/api/applications', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auditionId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to withdraw application');
    }
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to delete application'));
  }
};

export const getAuditionApplicants = async (
  auditionId: string
): Promise<AuditionApplicant[]> => {
  const applications = await getAuditionApplications(auditionId);

  return Promise.all(
    applications.map(async (application) => {
      const [talent, media] = await Promise.all([
        getTalentProfile(application.talentId).catch(() => null),
        getTalentMedia(application.talentId, true).catch(() => []),
      ]);
      return {
        application,
        talent,
        media: media.filter(
          (item) =>
            item.moderationStatus === 'active' &&
            item.visibility !== 'private'
        ),
      };
    })
  );
};
