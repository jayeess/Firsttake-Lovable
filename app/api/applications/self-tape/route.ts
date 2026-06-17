import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { parseJsonBody } from '@/app/lib/api-helpers';
import {
  getInitialSelfTapeStatus,
  validateSelfTapeLink,
} from '@/app/lib/self-tape-policy';
import {
  createNotifications,
  deliverNotifications,
} from '@/app/lib/notification-server';
import type { NotificationInput } from '@/app/lib/notification-policy';

export const runtime = 'nodejs';

const getAccount = async (uid: string) => {
  const snapshot = await getAdminDb().collection('users').doc(uid).get();
  if (!snapshot.exists) {
    throw new AdminRequestError('Your account profile could not be found.', 403);
  }
  return snapshot.data()!;
};

const getRequiredApplicationRefs = (auditionId: string, applicationId: string) => {
  const db = getAdminDb();
  const auditionRef = db.collection('auditions').doc(auditionId);
  const applicationRef = auditionRef.collection('applications').doc(applicationId);
  return { auditionRef, applicationRef };
};

const ensureTalentCanUpdate = async (uid: string, auditionId: string) => {
  const account = await getAccount(uid);
  if (account.userType !== 'TALENT' || account.accountStatus === 'SUSPENDED') {
    throw new AdminRequestError(
      'Only active Talent accounts can update self-tapes.',
      403
    );
  }
  const { auditionRef, applicationRef } = getRequiredApplicationRefs(auditionId, uid);
  const [audition, application] = await Promise.all([
    auditionRef.get(),
    applicationRef.get(),
  ]);
  if (!audition.exists || !application.exists) {
    throw new AdminRequestError('Application not found.', 404);
  }
  if (application.data()?.status === 'WITHDRAWN') {
    throw new AdminRequestError('Withdrawn applications cannot be updated.', 409);
  }
  if (audition.data()?.selfTapeEnabled !== true) {
    throw new AdminRequestError('This audition does not request a self-tape.', 409);
  }
  const deadline = audition.data()?.deadline?.toDate?.();
  if (deadline instanceof Date && deadline.getTime() <= Date.now()) {
    throw new AdminRequestError('The self-tape deadline has passed.', 409);
  }
  return { audition, application, applicationRef };
};

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = await parseJsonBody<{
      auditionId?: string;
      url?: string;
    }>(request, 16_000);
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');
    const { audition, applicationRef } = await ensureTalentCanUpdate(
      actor.uid,
      auditionId
    );
    const submissionTypes = audition.data()?.selfTapeSubmissionTypes;
    if (Array.isArray(submissionTypes) && !submissionTypes.includes('link')) {
      throw new AdminRequestError('This audition is not accepting self-tape links.');
    }
    const url = validateSelfTapeLink(body.url);
    await applicationRef.update({
      selfTapeStatus: 'submitted',
      selfTapeSubmission: {
        type: 'link',
        url,
        submittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      selfTapeReviewedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const auditionData = audition.data()!;
    const notifications: NotificationInput[] = [
      {
        recipientId: actor.uid,
        recipientRole: 'TALENT',
        type: 'self_tape_submitted',
        title: 'Self-tape submitted',
        message: `Your self-tape for ${auditionData.title ?? 'this audition'} was submitted.`,
        relatedEntityType: 'application',
        relatedEntityId: `${auditionId}/${actor.uid}`,
        actionUrl: '/applications',
        createdBy: actor.uid,
        dedupeKey: `self-tape-submitted:talent:${auditionId}:${actor.uid}`,
      },
    ];
    if (typeof auditionData.recruiterId === 'string') {
      notifications.push({
        recipientId: auditionData.recruiterId,
        recipientRole: 'RECRUITER',
        type: 'self_tape_submitted',
        title: 'Self-tape submitted',
        message: `An applicant submitted a self-tape for ${auditionData.title ?? 'your audition'}.`,
        relatedEntityType: 'application',
        relatedEntityId: `${auditionId}/${actor.uid}`,
        actionUrl: `/recruiter/auditions/${auditionId}/applicants`,
        createdBy: actor.uid,
        priority: 'HIGH',
        dedupeKey: `self-tape-submitted:recruiter:${auditionId}:${actor.uid}`,
      });
    }
    await deliverNotifications(() => createNotifications(notifications));

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireUser(request);
    const body = await parseJsonBody<{ auditionId?: string }>(request, 8_000);
    const auditionId = body.auditionId?.trim();
    if (!auditionId) throw new AdminRequestError('An audition ID is required.');
    const { audition, applicationRef } = await ensureTalentCanUpdate(
      actor.uid,
      auditionId
    );
    await applicationRef.update({
      selfTapeStatus: getInitialSelfTapeStatus({
        selfTapeEnabled: audition.data()?.selfTapeEnabled,
        selfTapeRequired: audition.data()?.selfTapeRequired,
      }),
      selfTapeSubmission: FieldValue.delete(),
      selfTapeReviewedAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ ok: true });
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
        'Only active Recruiter accounts can review self-tapes.',
        403
      );
    }
    const body = await parseJsonBody<{
      auditionId?: string;
      applicationId?: string;
    }>(request, 8_000);
    const auditionId = body.auditionId?.trim();
    const applicationId = body.applicationId?.trim();
    if (!auditionId || !applicationId) {
      throw new AdminRequestError('Valid self-tape review details are required.');
    }
    const { auditionRef, applicationRef } = getRequiredApplicationRefs(
      auditionId,
      applicationId
    );
    const [audition, application] = await Promise.all([
      auditionRef.get(),
      applicationRef.get(),
    ]);
    if (!audition.exists || audition.data()?.recruiterId !== actor.uid) {
      throw new AdminRequestError('Audition not found.', 404);
    }
    if (!application.exists || application.data()?.selfTapeStatus !== 'submitted') {
      throw new AdminRequestError('A submitted self-tape was not found.', 404);
    }
    await applicationRef.update({
      selfTapeStatus: 'reviewed',
      selfTapeReviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastRecruiterActionAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({
      action: 'self_tape_reviewed',
      actor,
      targetId: `${auditionId}/${applicationId}`,
      targetType: 'application',
      metadata: { auditionId, applicationId },
    });
    await deliverNotifications(() =>
      createNotifications([
        {
          recipientId: applicationId,
          recipientRole: 'TALENT',
          type: 'self_tape_reviewed',
          title: 'Self-tape reviewed',
          message: `The recruiter reviewed your self-tape for ${audition.data()?.title ?? 'an audition'}.`,
          relatedEntityType: 'application',
          relatedEntityId: `${auditionId}/${applicationId}`,
          actionUrl: '/applications',
          createdBy: actor.uid,
          dedupeKey: `self-tape-reviewed:${auditionId}:${applicationId}`,
        },
      ])
    );

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
