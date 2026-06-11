import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireAdmin,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminAuth, getAdminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

const allowedActions = new Set([
  'approve_recruiter',
  'reject_recruiter',
  'suspend_recruiter',
  'restore_recruiter',
  'verify_talent',
  'reject_talent',
  'suspend_talent',
  'restore_talent',
  'suspend_user',
  'restore_user',
  'remove_audition',
  'restore_audition',
]);

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = (await request.json()) as {
      action?: string;
      targetId?: string;
      reason?: string;
    };
    const action = body.action?.trim();
    const targetId = body.targetId?.trim();
    const reason = body.reason?.trim().slice(0, 1000);

    if (!action || !allowedActions.has(action) || !targetId) {
      throw new AdminRequestError('A valid action and target are required.');
    }
    if (
      [
        'reject_recruiter',
        'suspend_recruiter',
        'reject_talent',
        'suspend_talent',
        'suspend_user',
        'remove_audition',
      ].includes(action) &&
      !reason
    ) {
      throw new AdminRequestError('A reason is required for this action.');
    }

    const db = getAdminDb();
    const now = FieldValue.serverTimestamp();

    if (
      ['approve_recruiter', 'reject_recruiter', 'suspend_recruiter', 'restore_recruiter'].includes(action)
    ) {
      const status =
        action === 'approve_recruiter'
          ? 'approved'
          : action === 'reject_recruiter'
            ? 'rejected'
            : action === 'suspend_recruiter'
              ? 'suspended'
              : 'approved';
      const verificationRef = db.collection('recruiterVerifications').doc(targetId);
      const verification = await verificationRef.get();
      if (!verification.exists) {
        throw new AdminRequestError('Verification request was not found.', 404);
      }
      await db.runTransaction(async (transaction) => {
        transaction.update(verificationRef, {
          status,
          adminNote: reason ?? '',
          reviewedBy: actor.uid,
          reviewedAt: now,
          updatedAt: now,
        });
        transaction.set(
          db.collection('users').doc(targetId),
          {
            verificationStatus: status,
            accountStatus: status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
            updatedAt: now,
          },
          { merge: true }
        );
        transaction.set(
          db
            .collection('users')
            .doc(targetId)
            .collection('recruiterProfiles')
            .doc(targetId),
          {
            isVerified: status === 'approved',
            verificationStatus: status,
            updatedAt: now,
          },
          { merge: true }
        );
      });
      await writeAuditLog({
        action:
          action === 'restore_recruiter'
            ? 'recruiter_restored'
            : `recruiter_${status}`,
        actor,
        targetId,
        targetType: 'recruiter',
        reason,
      });
    } else if (
      ['verify_talent', 'reject_talent', 'suspend_talent', 'restore_talent'].includes(
        action
      )
    ) {
      const status =
        action === 'verify_talent' || action === 'restore_talent'
          ? 'verified'
          : action === 'reject_talent'
            ? 'rejected'
            : 'suspended';
      const verificationRef = db.collection('talentVerifications').doc(targetId);
      const verification = await verificationRef.get();
      if (!verification.exists) {
        throw new AdminRequestError(
          'Talent verification request was not found.',
          404
        );
      }
      const currentStatus = verification.data()?.talentVerificationStatus;
      if (
        (action === 'verify_talent' || action === 'reject_talent') &&
        currentStatus !== 'pending'
      ) {
        throw new AdminRequestError(
          'Only pending Talent requests can be reviewed.'
        );
      }
      if (action === 'restore_talent' && currentStatus !== 'suspended') {
        throw new AdminRequestError(
          'Only suspended Talent verification can be restored.'
        );
      }

      const profileRef = db
        .collection('users')
        .doc(targetId)
        .collection('talentProfiles')
        .doc(targetId);
      await db.runTransaction(async (transaction) => {
        transaction.update(verificationRef, {
          talentVerificationStatus: status,
          identityVerificationNote:
            action === 'verify_talent' ? reason ?? '' : '',
          rejectedReason:
            action === 'reject_talent' || action === 'suspend_talent'
              ? reason
              : '',
          reviewedBy: actor.uid,
          reviewedAt: now,
          verifiedAt: status === 'verified' ? now : null,
          updatedAt: now,
        });
        transaction.set(
          profileRef,
          {
            talentVerificationStatus: status,
            verifiedAt: status === 'verified' ? now : null,
            updatedAt: now,
          },
          { merge: true }
        );
        transaction.set(
          db.collection('users').doc(targetId),
          {
            talentVerificationStatus: status,
            accountStatus: status === 'suspended' ? 'SUSPENDED' : 'ACTIVE',
            updatedAt: now,
          },
          { merge: true }
        );
      });
      await getAdminAuth().updateUser(targetId, {
        disabled: status === 'suspended',
      });
      await writeAuditLog({
        action:
          action === 'verify_talent'
            ? 'talent_verified'
            : action === 'reject_talent'
              ? 'talent_rejected'
              : action === 'suspend_talent'
                ? 'talent_suspended'
                : 'talent_restored',
        actor,
        targetId,
        targetType: 'talent',
        reason,
      });
    } else if (action === 'suspend_user' || action === 'restore_user') {
      if (targetId === actor.uid) {
        throw new AdminRequestError('Administrators cannot suspend themselves.');
      }
      const suspended = action === 'suspend_user';
      await getAdminDb().collection('users').doc(targetId).set(
        {
          accountStatus: suspended ? 'SUSPENDED' : 'ACTIVE',
          updatedAt: now,
        },
        { merge: true }
      );
      await getAdminAuth().updateUser(targetId, { disabled: suspended });
      await writeAuditLog({
        action,
        actor,
        targetId,
        targetType: 'user',
        reason,
      });
    } else {
      const removed = action === 'remove_audition';
      await db.collection('auditions').doc(targetId).update({
        moderationStatus: removed ? 'REMOVED' : 'VISIBLE',
        moderationReason: reason ?? '',
        moderatedBy: actor.uid,
        moderatedAt: now,
      });
      await writeAuditLog({
        action,
        actor,
        targetId,
        targetType: 'audition',
        reason,
      });
    }

    return Response.json({ ok: true });
  } catch (error: unknown) {
    return adminErrorResponse(error);
  }
}
