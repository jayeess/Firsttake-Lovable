import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { getApplicationPolicyError } from '@/app/lib/application-policy';
import {
  buildApplicationSubmittedNotifications,
  type NotificationInput,
} from '@/app/lib/notification-policy';
import {
  createNotifications,
  deliverNotifications,
} from '@/app/lib/notification-server';
import type { ApplicationStatus, Audition } from '@/app/lib/types';

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
      recruiterNotes?: string;
      rejectionReason?: string;
    };
    const auditionId = body.auditionId?.trim();
    const applicationId = body.applicationId?.trim();
    const status = body.status;
    if (
      !auditionId ||
      !applicationId ||
      !status ||
      !['APPLIED', 'VIEWED', 'SHORTLISTED', 'REJECTED'].includes(status)
    ) {
      throw new AdminRequestError('Valid application review details are required.');
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

    const updates: Record<string, unknown> = {
      status,
      lastStatusChange: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (body.recruiterNotes?.trim()) {
      updates.recruiterNotes = body.recruiterNotes.trim().slice(0, 2000);
    }
    if (status === 'REJECTED') {
      updates.rejectionReason =
        body.rejectionReason?.trim().slice(0, 2000) ?? '';
    }
    await applicationRef.update(updates);

    const typeByStatus = {
      APPLIED: 'application_submitted',
      VIEWED: 'application_viewed',
      SHORTLISTED: 'application_shortlisted',
      REJECTED: 'application_rejected',
    } as const;
    const titleByStatus = {
      APPLIED: 'Application status updated',
      VIEWED: 'Your application was viewed',
      SHORTLISTED: 'You have been shortlisted',
      REJECTED: 'Application update',
    } as const;
    const auditionTitle = auditionSnapshot.data()?.title ?? 'an audition';
    const notification: NotificationInput = {
      recipientId: applicationSnapshot.data()?.talentId ?? applicationId,
      recipientRole: 'TALENT',
      type: typeByStatus[status],
      title: titleByStatus[status],
      message:
        status === 'SHORTLISTED'
          ? `Your application for ${auditionTitle} has been shortlisted.`
          : status === 'REJECTED'
            ? `The recruiter has completed their review for ${auditionTitle}.`
            : `The recruiter viewed your application for ${auditionTitle}.`,
      relatedEntityType: 'application',
      relatedEntityId: `${auditionId}/${applicationId}`,
      actionUrl: '/applications',
      createdBy: actor.uid,
      priority: status === 'SHORTLISTED' ? 'HIGH' : 'NORMAL',
      dedupeKey: `application-status:${auditionId}:${applicationId}:${status}`,
      metadata: { status },
    };
    await deliverNotifications(() => createNotifications([notification]));

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
    await applicationRef.delete();

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
