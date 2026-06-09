import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getFirebaseStorage } from './firebase';
import { getErrorMessage } from './error-utils';

// Upload profile photo
export const uploadProfilePhoto = async (
  uid: string,
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(
      getFirebaseStorage(),
      `talentProfiles/${uid}/photos/${file.name}`
    );
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Profile photo upload failed'));
  }
};

// Upload introduction video
export const uploadIntroductionVideo = async (
  uid: string,
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(
      getFirebaseStorage(),
      `talentProfiles/${uid}/videos/${Date.now()}_${file.name}`
    );
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Introduction video upload failed'));
  }
};

// Upload company logo
export const uploadCompanyLogo = async (
  uid: string,
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(getFirebaseStorage(), `recruiterProfiles/${uid}/logo`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Company logo upload failed'));
  }
};

// Delete file from storage
export const deleteFile = async (fileUrl: string) => {
  try {
    const fileRef = ref(getFirebaseStorage(), fileUrl);
    await deleteObject(fileRef);
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'File deletion failed'));
  }
};
