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
  TalentCategory,
  TalentProfile,
  TalentMedia,
  TalentMediaType,
  TalentMediaVisibility,
  TalentVerification,
  UserType,
  RecruiterVerification,
  SavedAudition,
  WorkMode,
  PaymentType,
} from './types';
import type { RecruiterReviewInput } from './application-pipeline';
import { calculateTalentProfileCompleteness } from './talent-trust-policy';
import { buildAuditionSearchFields } from './audition-discovery';

export interface UserAccount {
  uid: string;
  email: string | null;
  userType: Exclude<UserType, 'ADMIN'>;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
}

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
    return profileDoc.exists() ? (profileDoc.data() as TalentProfile) : null;
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
        'Firebase denied this write. Your recruiter account has been repaired, but the project Firestore rules still need to allow recruiter audition creation.'
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
  coverMessage?: string
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
      body: JSON.stringify({ auditionId, coverMessage }),
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
        'Firebase could not confirm this account as Talent. Log out, log in again, and retry. If it continues, the account role document or deployed Firestore rules need repair.'
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

        const audition = await getAuditionById(auditionId);
        return {
          id: applicationDoc.id,
          auditionId,
          audition,
          ...applicationDoc.data(),
        } as Application;
      })
    );

    return applicationResults.filter(
      (application): application is Application => application !== null
    );
  } catch (collectionGroupError: unknown) {
    try {
      const db = getFirestoreDb();
      const auditionsSnapshot = await getDocs(collection(db, 'auditions'));
      const applicationResults = await Promise.all(
        auditionsSnapshot.docs.map(async (auditionDoc) => {
          const applicationSnapshot = await getDoc(
            doc(db, 'auditions', auditionDoc.id, 'applications', talentId)
          );

          if (!applicationSnapshot.exists()) {
            return null;
          }

          return {
            id: applicationSnapshot.id,
            auditionId: auditionDoc.id,
            audition: {
              id: auditionDoc.id,
              ...auditionDoc.data(),
            } as Audition,
            ...applicationSnapshot.data(),
          } as Application;
        })
      );

      return applicationResults
        .filter(
          (application): application is Application => application !== null
        )
        .sort((first, second) => {
          const firstCreatedAt =
            !first.createdAt
              ? 0
              : first.createdAt instanceof Date
              ? first.createdAt.getTime()
              : first.createdAt.toMillis();
          const secondCreatedAt =
            !second.createdAt
              ? 0
              : second.createdAt instanceof Date
              ? second.createdAt.getTime()
              : second.createdAt.toMillis();
          return secondCreatedAt - firstCreatedAt;
        });
    } catch (fallbackError: unknown) {
      const primaryMessage = getErrorMessage(
        collectionGroupError,
        'Failed to load talent applications'
      );
      const fallbackMessage = getErrorMessage(
        fallbackError,
        'The compatibility query also failed'
      );
      throw new Error(`${primaryMessage} ${fallbackMessage}`);
    }
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
