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
  QueryConstraint,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { getErrorMessage } from './error-utils';

// ==================== TALENT PROFILE ====================

export const createTalentProfile = async (
  uid: string,
  profileData: {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    height: string;
    bio: string;
    category: string;
    experienceLevel: string;
    location: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    websiteUrl?: string;
    isPublic: boolean;
  }
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

export const getTalentProfile = async (uid: string) => {
  try {
    const profileDoc = await getDoc(
      doc(getFirestoreDb(), 'users', uid, 'talentProfiles', uid)
    );
    return profileDoc.exists() ? profileDoc.data() : null;
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
  profileData: {
    companyName: string;
    phone: string;
    address: string;
    website?: string;
    bio?: string;
    companyLogo?: string;
  }
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

export const getRecruiterProfile = async (uid: string) => {
  try {
    const profileDoc = await getDoc(
      doc(getFirestoreDb(), 'users', uid, 'recruiterProfiles', uid)
    );
    return profileDoc.exists() ? profileDoc.data() : null;
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
    title: string;
    description: string;
    category: string;
    experienceLevel: string;
    location: string;
    duration: string;
    requirements: string;
    numberOfPositions: number;
    payInfo?: string;
    deadline: Date;
    status: string;
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
    throw new Error(getErrorMessage(error, 'Failed to create audition'));
  }
};

export const getAuditions = async (
  constraints: QueryConstraint[] = []
) => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions'),
      where('status', '==', 'ACTIVE'),
      ...constraints
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load auditions'));
  }
};

export const getAuditionById = async (auditionId: string) => {
  try {
    const auditionDoc = await getDoc(doc(getFirestoreDb(), 'auditions', auditionId));
    return auditionDoc.exists()
      ? { id: auditionDoc.id, ...auditionDoc.data() }
      : null;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to load audition'));
  }
};

export const getRecruiterAuditions = async (recruiterId: string) => {
  try {
    const q = query(
      collection(getFirestoreDb(), 'auditions'),
      where('recruiterId', '==', recruiterId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
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
    // Check if talent already applied
    const q = query(
      collection(getFirestoreDb(), 'auditions', auditionId, 'applications'),
      where('talentId', '==', talentId)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      throw new Error('You have already applied for this audition');
    }

    // Create application
    const applicationRef = await addDoc(
      collection(getFirestoreDb(), 'auditions', auditionId, 'applications'),
      {
        talentId,
        coverMessage: coverMessage || '',
        status: 'APPLIED',
        lastStatusChange: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );

    // Increment audition applicant count
    const auditionDoc = await getDoc(doc(getFirestoreDb(), 'auditions', auditionId));
    if (auditionDoc.exists()) {
      const currentCount = auditionDoc.data().applicantCount || 0;
      await updateDoc(doc(getFirestoreDb(), 'auditions', auditionId), {
        applicantCount: currentCount + 1,
      });
    }

    return applicationRef.id;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to submit application'));
  }
};

export const getTalentApplications = async (talentId: string) => {
  try {
    const q = collectionGroup(getFirestoreDb(), 'applications');
    const talentApplicationsQuery = query(q, where('talentId', '==', talentId));
    const querySnapshot = await getDocs(talentApplicationsQuery);

    const applications = [];
    for (const doc of querySnapshot.docs) {
      const auditionId = doc.ref.parent.parent?.id;
      if (auditionId) {
        const audition = await getAuditionById(auditionId);
        applications.push({
          id: doc.id,
          auditionId,
          audition,
          ...doc.data(),
        });
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
