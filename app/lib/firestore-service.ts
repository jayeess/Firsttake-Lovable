import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  collectionGroup,
  addDoc,
  increment,
  QueryConstraint,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { getErrorMessage } from './error-utils';
import type {
  Application,
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

    if (!snapshot.exists() || snapshot.data().userType !== userType) {
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
    await setDoc(doc(getFirestoreDb(), 'users', uid, 'recruiterProfiles', uid), {
      ...profileData,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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
    const applicationDoc = doc(
      getFirestoreDb(),
      'auditions',
      auditionId,
      'applications',
      talentId
    );
    const existing = await getDoc(applicationDoc);

    if (existing.exists()) {
      throw new Error('You have already applied for this audition');
    }

    await setDoc(applicationDoc, {
      talentId,
      coverMessage: coverMessage || '',
      status: 'APPLIED',
      lastStatusChange: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await updateDoc(doc(getFirestoreDb(), 'auditions', auditionId), {
      applicantCount: increment(1),
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
    const q = collectionGroup(getFirestoreDb(), 'applications');
    const talentApplicationsQuery = query(q, where('talentId', '==', talentId));
    const querySnapshot = await getDocs(talentApplicationsQuery);

    const applications: Application[] = [];
    for (const applicationDoc of querySnapshot.docs) {
      const auditionId = applicationDoc.ref.parent.parent?.id;
      if (auditionId) {
        const audition = await getAuditionById(auditionId);
        applications.push({
          id: applicationDoc.id,
          auditionId,
          audition,
          ...applicationDoc.data(),
        } as Application);
      }
    }
    return applications;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load talent applications'));
  }
};

export const getAuditionApplications = async (auditionId: string) => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions', auditionId, 'applications')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load audition applications'));
  }
};

export const updateApplicationStatus = async (
  auditionId: string,
  applicationId: string,
  newStatus: string,
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
    await deleteDoc(
      doc(getFirestoreDb(), 'auditions', auditionId, 'applications', applicationId)
    );
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to delete application'));
  }
};
