import {
  deleteObject,
  getDownloadURL,
  ref,
  type UploadTaskSnapshot,
  uploadBytesResumable,
} from 'firebase/storage';
import { getFirebaseStorage } from './firebase';
import { getErrorMessage } from './error-utils';
import {
  buildTalentMediaPath,
  validateTalentImage,
} from './talent-media-policy';

const uploadImage = async ({
  uid,
  mediaId,
  kind,
  file,
  onProgress,
}: {
  uid: string;
  mediaId: string;
  kind: 'profile' | 'portfolio';
  file: File;
  onProgress?: (progress: number) => void;
}) => {
  const validationError = validateTalentImage(file, kind);
  if (validationError) throw new Error(validationError);
  const storagePath = buildTalentMediaPath({
    uid,
    mediaId,
    kind,
    mimeType: file.type,
  });
  const uploadRef = ref(getFirebaseStorage(), storagePath);

  try {
    const snapshot = await new Promise<UploadTaskSnapshot>(
      (resolve, reject) => {
        const task = uploadBytesResumable(uploadRef, file, {
          contentType: file.type,
          customMetadata: {
            ownerId: uid,
            visibility: 'recruiters',
            mediaKind: kind,
          },
        });
        task.on(
          'state_changed',
          (state) =>
            onProgress?.(
              Math.round((state.bytesTransferred / state.totalBytes) * 100)
            ),
          reject,
          () => resolve(task.snapshot)
        );
      }
    );
    return {
      url: await getDownloadURL(snapshot.ref),
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Talent media upload failed'));
  }
};

export const uploadProfilePhoto = (
  uid: string,
  mediaId: string,
  file: File,
  onProgress?: (progress: number) => void
) => uploadImage({ uid, mediaId, kind: 'profile', file, onProgress });

export const uploadPortfolioImage = (
  uid: string,
  mediaId: string,
  file: File,
  onProgress?: (progress: number) => void
) => uploadImage({ uid, mediaId, kind: 'portfolio', file, onProgress });

export const deleteStoragePath = async (storagePath?: string) => {
  if (!storagePath) return;
  try {
    await deleteObject(ref(getFirebaseStorage(), storagePath));
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Media deletion failed');
    if (!message.includes('object-not-found')) throw new Error(message);
  }
};

export const uploadCompanyLogo = async (uid: string, file: File) => {
  const logoRef = ref(getFirebaseStorage(), `recruiterProfiles/${uid}/logo`);
  const snapshot = await new Promise<UploadTaskSnapshot>(
    (resolve, reject) => {
      const task = uploadBytesResumable(logoRef, file);
      task.on('state_changed', undefined, reject, () => resolve(task.snapshot));
    }
  );
  return getDownloadURL(snapshot.ref);
};
