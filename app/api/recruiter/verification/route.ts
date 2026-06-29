import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import {
  createNotification,
  deliverNotifications,
  notifyAdmins,
} from '@/app/lib/notification-server';
import {
  ALLOWED_RECRUITER_EVIDENCE_TYPES,
  MAX_RECRUITER_EVIDENCE_COUNT,
  RECRUITER_EVIDENCE_MAX_BYTES,
  isRecruiterEvidenceStoragePath,
} from '@/app/lib/upload-policy';
import type { RecruiterVerificationEvidence } from '@/app/lib/types';

export const runtime = 'nodejs';

const fields = [
  'legalName',
  'contactPerson',
  'phone',
  'website',
  'socialProofUrl',
  'businessType',
  'workDescription',
  'verificationNotes',
] as const;

const sanitizeEvidence = (
  input: unknown,
  uid: string
): RecruiterVerificationEvidence[] => {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw new AdminRequestError('Verification evidence must be a list.');
  }
  if (input.length > MAX_RECRUITER_EVIDENCE_COUNT) {
    throw new AdminRequestError(
      `Upload ${MAX_RECRUITER_EVIDENCE_COUNT} verification files or fewer.`
    );
  }
  return input.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AdminRequestError('Verification evidence metadata is invalid.');
    }
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const fileName =
      typeof record.fileName === 'string' ? record.fileName.trim() : '';
    const mimeType =
      typeof record.mimeType === 'string' ? record.mimeType.trim() : '';
    const storagePath =
      typeof record.storagePath === 'string' ? record.storagePath.trim() : '';
    const sizeBytes =
      typeof record.sizeBytes === 'number' ? record.sizeBytes : 0;
    if (
      !id ||
      !fileName ||
      !storagePath ||
      !ALLOWED_RECRUITER_EVIDENCE_TYPES.includes(mimeType as never) ||
      sizeBytes <= 0 ||
      sizeBytes > RECRUITER_EVIDENCE_MAX_BYTES ||
      !isRecruiterEvidenceStoragePath(uid, storagePath)
    ) {
      throw new AdminRequestError(
        `Verification evidence ${index + 1} could not be confirmed.`
      );
    }
    return {
      id: id.slice(0, 80),
      fileName: fileName.slice(0, 160),
      mimeType,
      sizeBytes,
      storagePath,
      uploadedAt:
        typeof record.uploadedAt === 'string'
          ? record.uploadedAt.slice(0, 80)
          : undefined,
    };
  });
};

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const db = getAdminDb();
    const account = await db.collection('users').doc(actor.uid).get();
    if (!account.exists || account.data()?.userType !== 'RECRUITER') {
      throw new AdminRequestError('Only recruiter accounts can submit verification.', 403);
    }

    const input = (await request.json()) as Record<string, unknown>;
    const data: Record<string, string> = {};
    for (const field of fields) {
      const value = typeof input[field] === 'string' ? input[field].trim() : '';
      data[field] = value.slice(0, field === 'workDescription' ? 2000 : 500);
    }
    if (
      !data.legalName ||
      !data.contactPerson ||
      !data.phone ||
      !data.businessType ||
      !data.workDescription
    ) {
      throw new AdminRequestError('Complete all required verification fields.');
    }
    const evidence = sanitizeEvidence(input.evidence, actor.uid);

    const ref = db.collection('recruiterVerifications').doc(actor.uid);
    const existing = await ref.get();
    const currentStatus = existing.exists
      ? existing.data()?.status
      : 'not_submitted';
    if (!['not_submitted', 'rejected'].includes(currentStatus)) {
      throw new AdminRequestError('This request cannot be resubmitted right now.');
    }

    await ref.set(
      {
        ...data,
        evidence,
        recruiterId: actor.uid,
        recruiterEmail: actor.email ?? null,
        status: 'pending',
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await writeAuditLog({
      action: 'recruiter_verification_submitted',
      actor,
      targetId: actor.uid,
      targetType: 'recruiter',
    });
    await deliverNotifications(async () => {
      await Promise.all([
        createNotification({
          recipientId: actor.uid,
          recipientRole: 'RECRUITER',
          type: 'recruiter_verification_submitted',
          title: 'Verification submitted',
          message:
            'Your company verification request is now awaiting admin review.',
          relatedEntityType: 'verification',
          relatedEntityId: actor.uid,
          actionUrl: '/recruiter/verification',
          createdBy: actor.uid,
        }),
        notifyAdmins({
          type: 'recruiter_verification_submitted',
          title: 'Recruiter verification request',
          message: `${data.legalName} submitted a company verification request.`,
          relatedEntityType: 'verification',
          relatedEntityId: actor.uid,
          actionUrl: '/admin/verifications',
          createdBy: actor.uid,
          priority: 'HIGH',
        }),
      ]);
    });
    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
