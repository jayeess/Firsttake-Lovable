import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { getApplicationPolicyError } from '@/app/lib/application-policy';
import {
  buildApplicationSubmittedNotifications,
  buildApplicationStatusNotification,
  type NotificationInput,
} from '@/app/lib/notification-policy';
import {
  createNotifications,
  deliverNotifications,
} from '@/app/lib/notification-server';
import type { ApplicationStatus, Audition } from '@/app/lib/types';
import {
  getApplicationStatus,
  getStatusTimestampField,
  TALENT_VISIBLE_NOTE_MAX_LENGTH,
  validateRecruiterReview,
} from '@/app/lib/application-pipeline';
import { getInitialSelfTapeStatus } from '@/app/lib/self-tape-policy';

export const runtime = 'nodejs';

const getAccount = async (uid: string) => {
  const snapshot = await getAdminDb().collection('users').doc(uid).get();
  if (!snapshot.exists) {
    throw new AdminRequestError('Your account profile could not be found.', 403);
  }
  return snapshot.data()!;
};

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const account = await getAccount(actor.uid);
    if (
      account.userType !== 'TALENT' ||
      account.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError(
        'Only active Talent accounts can apply to auditions.',
        403
      );
    }

    const body = (await request.json()) as {
      auditionId?: string;
      coverMessage?: string;
    };
    const auditionId = body.auditionId?.trim();
    if (!auditionId) {
      throw new AdminRequestError('An audition ID is required.');
    }

    const db = getAdminDb();
    const auditionRef = db.collection('auditions').doc(auditionId);
    const applicationRef = auditionRef.collection('applications').doc(actor.uid);
    let audition: (Omit<Audition, 'id'> & { deadline: Timestamp }) | null = null;

    await db.runTransaction(async (transaction) => {
      const [auditionSnapshot, applicationSnapshot] = await Promise.all([
        transaction.get(auditionRef),
        transaction.get(applicationRef),
      ]);
      audition = auditionSnapshot.exists
        ? (auditionSnapshot.data() as Omit<Audition, 'id'> & {
            deadline: Timestamp;
          })
        : null;
      const policyError = getApplicationPolicyError({
        auditionExists: auditionSnapshot.exists,
        alreadyApplied: applicationSnapshot.exists,
        status: audition?.status,
        deadline: audition?.deadline?.toDate(),
      });
      if (policyError) throw new AdminRequestError(policyError, 409);
      if (audition?.moderationStatus === 'REMOVED') {
        throw new AdminRequestError(
          'This audition is not accepting applications.',
          409
        );
      }

      transaction.set(applicationRef, {
        talentId: actor.uid,
        talentEmail: actor.email ?? null,
        coverMessage: body.coverMessage?.trim().slice(0, 3000) ?? '',
        status: 'APPLIED',
        recruiterStatus: 'APPLIED',
        selfTapeStatus: getInitialSelfTapeStatus({
          selfTapeEnabled: audition?.selfTapeEnabled,
          selfTapeRequired: audition?.selfTapeRequired,
        }),
        statusUpdatedBy: actor.uid,
        statusUpdatedAt: FieldValue.serverTimestamp(),
        lastStatusChange: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const submittedAudition = audition as
      | (Omit<Audition, 'id'> & { deadline: Timestamp })
      | null;
    if (submittedAudition) {
      await deliverNotifications(() =>
        createNotifications(
          buildApplicationSubmittedNotifications({
            talentId: actor.uid,
            recruiterId: submittedAudition.recruiterId,
            auditionId,
            auditionTitle: submittedAudition.title,
          })
        )
      );
    }

    return Response.json({ ok: true, applicationId: actor.uid });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireUser(request);
    const account = await getAccount(actor.uid);
    if (
      account.userType !== 'RECRUITER' ||
      account.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError(
        'Only active Recruiter accounts can review applications.',
        403
      );
    }
    const verification = await getAdminDb()
      .collection('recruiterVerifications')
      .doc(actor.uid)
      .get();
    if (verification.data()?.status !== 'approved') {
      throw new AdminRequestError(
        'Recruiter verification approval is required to review applications.',
        403
      );
    }

    const body = (await request.json()) as {
      auditionId?: string;
      applicationId?: string;
      status?: ApplicationStatus;
      recruiterNote?: string;
      recruiterNotes?: string;
      recruiterRating?: number | null;
      internalTags?: string[];
      rejectionReason?: string;
      talentNextStepNote?: string;
    };
    const auditionId = body.auditionId?.trim();
    const applicationId = body.applicationId?.trim();
    if (!auditionId || !applicationId) {
      throw new AdminRequestError('Valid application review details are required.');
    }
    const requestedNote = body.recruiterNote ?? body.recruiterNotes;
    const hasReviewChange =
      body.status !== undefined ||
      requestedNote !== undefined ||
      body.recruiterRating !== undefined ||
      body.internalTags !== undefined ||
      body.talentNextStepNote !== undefined;
    if (!hasReviewChange) {
      throw new AdminRequestError('Add a status, note, rating, or tag update.');
    }

    const db = getAdminDb();
    const auditionRef = db.collection('auditions').doc(auditionId);
    const applicationRef = auditionRef
      .collection('applications')
      .doc(applicationId);
    const [auditionSnapshot, applicationSnapshot] = await Promise.all([
      auditionRef.get(),
      applicationRef.get(),
    ]);
    if (
      !auditionSnapshot.exists ||
      auditionSnapshot.data()?.recruiterId !== actor.uid
    ) {
      throw new AdminRequestError('Audition not found.', 404);
    }
    if (!applicationSnapshot.exists) {
      throw new AdminRequestError('Application not found.', 404);
    }

    const applicationData = applicationSnapshot.data()!;
    const currentStatus = getApplicationStatus({
      status: applicationData.status,
      recruiterStatus: applicationData.recruiterStatus,
    });
    const policyError = validateRecruiterReview(currentStatus, {
      status: body.status,
      recruiterNote: requestedNote,
      recruiterRating: body.recruiterRating,
      internalTags: body.internalTags,
      talentNextStepNote: body.talentNextStepNote,
    });
    if (policyError) throw new AdminRequestError(policyError, 409);

    const now = Timestamp.now();
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastRecruiterActionAt: FieldValue.serverTimestamp(),
    };
    const status = body.status;
    if (status) {
      updates.status = status;
      updates.recruiterStatus = status;
      updates.statusUpdatedAt = FieldValue.serverTimestamp();
      updates.statusUpdatedBy = actor.uid;
      updates.lastStatusChange = FieldValue.serverTimestamp();
      updates.statusHistory = FieldValue.arrayUnion({
        status,
        changedBy: actor.uid,
        changedAt: now,
      });
      const timestampField = getStatusTimestampField(status);
      if (timestampField) updates[timestampField] = FieldValue.serverTimestamp();
    }
    if (requestedNote !== undefined) {
      updates.recruiterNote = requestedNote.trim().slice(0, 2000);
      updates.recruiterNotes = FieldValue.delete();
    }
    if (body.recruiterRating !== undefined) {
      updates.recruiterRating =
        body.recruiterRating === null
          ? FieldValue.delete()
          : body.recruiterRating;
    }
    if (body.internalTags !== undefined) {
      updates.internalTags = Array.from(
        new Set(
          body.internalTags
            .map((tag) => tag.trim().slice(0, 30))
            .filter(Boolean)
        )
      ).slice(0, 10);
    }
    if (status === 'REJECTED') {
      updates.rejectionReason =
        body.rejectionReason?.trim().slice(0, 2000) ?? '';
    }
    if (body.talentNextStepNote !== undefined) {
      const trimmed = body.talentNextStepNote.trim().slice(0, TALENT_VISIBLE_NOTE_MAX_LENGTH);
      updates.talentNextStepNote = trimmed || FieldValue.delete();
    }
    await applicationRef.update(updates);

    const auditionTitle = auditionSnapshot.data()?.title ?? 'an audition';
    if (status) {
      const notification = buildApplicationStatusNotification({
        talentId: applicationData.talentId ?? applicationId,
        recruiterId: actor.uid,
        auditionId,
        auditionTitle,
        status,
      });
      if (notification) {
        await deliverNotifications(() => createNotifications([notification]));
      }
      await writeAuditLog({
        action: `application_${status.toLowerCase()}`,
        actor,
        targetId: `${auditionId}/${applicationId}`,
        targetType: 'application',
        metadata: {
          auditionId,
          applicationId,
          previousStatus: currentStatus,
          status,
        },
      });
    }
    if (requestedNote !== undefined) {
      await writeAuditLog({
        action: 'recruiter_note_updated',
        actor,
        targetId: `${auditionId}/${applicationId}`,
        targetType: 'application',
        metadata: { auditionId, applicationId },
      });
    }
    if (body.talentNextStepNote !== undefined) {
      await writeAuditLog({
        action: 'talent_visible_note_updated',
        actor,
        targetId: `${auditionId}/${applicationId}`,
        targetType: 'application',
        metadata: { auditionId, applicationId },
      });
    }

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireUser(request);
    const account = await getAccount(actor.uid);
    if (
      account.userType !== 'TALENT' ||
      account.accountStatus === 'SUSPENDED'
    ) {
      throw new AdminRequestError(
        'Only active Talent accounts can withdraw applications.',
        403
      );
    }

    const body = (await request.json()) as { auditionId?: string };
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');

    const db = getAdminDb();
    const auditionRef = db.collection('auditions').doc(auditionId);
    const applicationRef = auditionRef.collection('applications').doc(actor.uid);
    const [auditionSnapshot, applicationSnapshot] = await Promise.all([
      auditionRef.get(),
      applicationRef.get(),
    ]);
    if (!applicationSnapshot.exists) {
      throw new AdminRequestError('Application not found.', 404);
    }
    if (applicationSnapshot.data()?.status === 'WITHDRAWN') {
      throw new AdminRequestError('This application is already withdrawn.', 409);
    }
    await applicationRef.update({
      status: 'WITHDRAWN',
      recruiterStatus: 'WITHDRAWN',
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: actor.uid,
      lastStatusChange: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      statusHistory: FieldValue.arrayUnion({
        status: 'WITHDRAWN',
        changedBy: actor.uid,
        changedAt: Timestamp.now(),
      }),
    });

    const auditionTitle = auditionSnapshot.data()?.title ?? 'an audition';
    const recruiterId = auditionSnapshot.data()?.recruiterId;
    const notifications: NotificationInput[] = [
      {
        recipientId: actor.uid,
        recipientRole: 'TALENT',
        type: 'application_withdrawn',
        title: 'Application withdrawn',
        message: `Your application for ${auditionTitle} was withdrawn.`,
        relatedEntityType: 'application',
        relatedEntityId: `${auditionId}/${actor.uid}`,
        actionUrl: '/applications',
        createdBy: actor.uid,
      },
    ];
    if (typeof recruiterId === 'string') {
      notifications.push({
        recipientId: recruiterId,
        recipientRole: 'RECRUITER',
        type: 'application_withdrawn',
        title: 'Application withdrawn',
        message: `An applicant withdrew from ${auditionTitle}.`,
        relatedEntityType: 'application',
        relatedEntityId: `${auditionId}/${actor.uid}`,
        actionUrl: `/recruiter/auditions/${auditionId}/applicants`,
        createdBy: actor.uid,
      });
    }
    await deliverNotifications(() => createNotifications(notifications));

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
