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
  increment,
  runTransaction,
  serverTimestamp,
  QueryConstraint,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { getErrorMessage } from './error-utils';
import { getApplicationPolicyError } from './application-policy';
import type {
  Application,
  ApplicationStatus,
  AuditionApplicant,
  Audition,
  ExperienceLevel,
  RecruiterProfile,
  TalentCategory,
  TalentProfile,
  UserType,
} from './types';

export interface UserAccount {
  uid: string;
  email: string | null;
  userType: Exclude<UserType, 'ADMIN'>;
}

export const ensureUserAccount = async (
  uid: string,
  email: string | null,
  userType: Exclude<UserType, 'ADMIN'>
) => {
  try {
    const userRef = doc(getFirestoreDb(), 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      await setDoc(
        userRef,
        {
          uid,
          email,
          userType,
          emailVerified: false,
          phoneVerified: false,
          accountStatus: 'ACTIVE',
          isAdmin: false,
          updatedAt: new Date(),
          ...(snapshot.exists() ? {} : { createdAt: new Date() }),
        },
        { merge: true }
      );
      return;
    }

    if (snapshot.data().userType !== userType) {
      throw new Error(
        `This account is registered as ${String(snapshot.data().userType).toLowerCase()}, not ${userType.toLowerCase()}.`
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
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load user account'));
  }
};

// ==================== TALENT PROFILE ====================

export const createTalentProfile = async (
  uid: string,
  profileData: TalentProfile
) => {
  try {
    await setDoc(doc(getFirestoreDb(), 'users', uid, 'talentProfiles', uid), {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
    deadline: Date;
    status: 'ACTIVE' | 'DRAFT';
  }
) => {
  try {
    const account = await getUserAccount(recruiterId);
    if (account?.userType !== 'RECRUITER') {
      throw new Error('Only recruiter accounts can create auditions.');
    }

    const docRef = await addDoc(collection(getFirestoreDb(), 'auditions'), {
      recruiterId,
      ...auditionData,
      applicantCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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

export const getAuditions = async (
  constraints: QueryConstraint[] = []
): Promise<Audition[]> => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions'),
      where('status', '==', 'ACTIVE'),
      ...constraints
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (snapshot) =>
        ({
          id: snapshot.id,
          ...snapshot.data(),
        }) as Audition
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load auditions'));
  }
};

export const getAuditionById = async (
  auditionId: string
): Promise<Audition | null> => {
  try {
    const auditionDoc = await getDoc(doc(getFirestoreDb(), 'auditions', auditionId));
    return auditionDoc.exists()
      ? ({ id: auditionDoc.id, ...auditionDoc.data() } as Audition)
      : null;
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
    return querySnapshot.docs.map(
      (snapshot) =>
        ({
          id: snapshot.id,
          ...snapshot.data(),
        }) as Audition
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
    const account = await getUserAccount(talentId);
    if (account?.userType !== 'TALENT') {
      throw new Error('Only talent accounts can apply to auditions.');
    }

    const db = getFirestoreDb();
    const auditionRef = doc(db, 'auditions', auditionId);
    const applicationRef = doc(
      db,
      'auditions',
      auditionId,
      'applications',
      talentId
    );

    await runTransaction(db, async (transaction) => {
      const [auditionSnapshot, applicationSnapshot] = await Promise.all([
        transaction.get(auditionRef),
        transaction.get(applicationRef),
      ]);

      const audition = auditionSnapshot.exists()
        ? (auditionSnapshot.data() as Omit<Audition, 'id'>)
        : null;
      const deadline = audition
        ? audition.deadline instanceof Date
          ? audition.deadline
          : audition.deadline.toDate()
        : undefined;
      const policyError = getApplicationPolicyError({
        auditionExists: auditionSnapshot.exists(),
        alreadyApplied: applicationSnapshot.exists(),
        status: audition?.status,
        deadline,
      });

      if (policyError) {
        throw new Error(policyError);
      }

      const now = new Date();
      transaction.set(applicationRef, {
        talentId,
        talentEmail: account.email,
        coverMessage: coverMessage || '',
        status: 'APPLIED',
        lastStatusChange: now,
        createdAt: now,
        updatedAt: now,
      });
      transaction.update(auditionRef, {
        applicantCount: increment(1),
        updatedAt: now,
      });
    });

    return talentId;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to submit application'));
  }
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
  recruiterNotes?: string,
  rejectionReason?: string
) => {
  try {
    const updates: UpdateData<DocumentData> = {
      status: newStatus,
      lastStatusChange: new Date(),
      updatedAt: new Date(),
    };

    if (recruiterNotes) {
      updates.recruiterNotes = recruiterNotes;
    }

    if (rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    await updateDoc(
      doc(getFirestoreDb(), 'auditions', auditionId, 'applications', applicationId),
      updates
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to update application status'));
  }
};

export const deleteApplication = async (
  auditionId: string,
  applicationId: string
) => {
  try {
    const db = getFirestoreDb();
    const auditionRef = doc(db, 'auditions', auditionId);
    const applicationRef = doc(
      db,
      'auditions',
      auditionId,
      'applications',
      applicationId
    );

    await runTransaction(db, async (transaction) => {
      const [auditionSnapshot, applicationSnapshot] = await Promise.all([
        transaction.get(auditionRef),
        transaction.get(applicationRef),
      ]);

      if (!applicationSnapshot.exists()) {
        return;
      }

      if (!auditionSnapshot.exists()) {
        throw new Error('The audition linked to this application no longer exists.');
      }

      const applicantCount = auditionSnapshot.data().applicantCount ?? 0;
      transaction.delete(applicationRef);
      transaction.update(auditionRef, {
        applicantCount: Math.max(0, applicantCount - 1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to delete application'));
  }
};

export const getAuditionApplicants = async (
  auditionId: string
): Promise<AuditionApplicant[]> => {
  const applications = await getAuditionApplications(auditionId);

  return Promise.all(
    applications.map(async (application) => ({
      application,
      talent: await getTalentProfile(application.talentId).catch(() => null),
    }))
  );
};
