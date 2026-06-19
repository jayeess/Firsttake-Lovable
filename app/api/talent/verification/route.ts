import { FieldValue } from 'firebase-admin/firestore';
import {
  adminErrorResponse,
  AdminRequestError,
  requireUser,
  writeAuditLog,
} from '@/app/lib/admin-server';
import { getAdminDb } from '@/app/lib/firebase-admin';
import { calculateTalentProfileCompleteness } from '@/app/lib/profile-completeness';
import { canSubmitTalentVerification } from '@/app/lib/talent-trust-policy';
import type { TalentProfile, TalentVerificationStatus } from '@/app/lib/types';
import {
  createNotification,
  deliverNotifications,
  notifyAdmins,
} from '@/app/lib/notification-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const actor = await requireUser(request);
    const db = getAdminDb();
    const accountRef = db.collection('users').doc(actor.uid);
    const profileRef = accountRef.collection('talentProfiles').doc(actor.uid);
    const verificationRef = db.collection('talentVerifications').doc(actor.uid);
    const [account, profile, verification] = await Promise.all([
      accountRef.get(),
      profileRef.get(),
      verificationRef.get(),
    ]);

    if (!account.exists || account.data()?.userType !== 'TALENT') {
      throw new AdminRequestError(
        'Only Talent accounts can submit talent verification.',
        403
      );
    }
    if (!profile.exists) {
      throw new AdminRequestError(
        'Complete and save your Talent profile before submitting.',
        400
      );
    }

    const completeness = calculateTalentProfileCompleteness(
      profile.data() as TalentProfile
    );
    const status = (verification.data()?.talentVerificationStatus ??
      profile.data()?.talentVerificationStatus ??
      'not_submitted') as TalentVerificationStatus;

    if (!canSubmitTalentVerification(status, completeness.score)) {
      throw new AdminRequestError(
        status === 'pending'
          ? 'Your Talent verification is already pending review.'
          : status === 'verified'
            ? 'This Talent profile is already verified.'
            : status === 'suspended'
              ? 'This Talent verification is suspended.'
              : 'Reach the minimum profile completeness before submitting.',
        409
      );
    }

    const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (transaction) => {
      transaction.set(
        verificationRef,
        {
          talentId: actor.uid,
          talentEmail: actor.email ?? null,
          talentVerificationStatus: 'pending',
          profileCompletenessScore: completeness.score,
          profileCompletenessChecklist: completeness.checklist,
          identityVerificationNote: '',
          portfolioReviewNote: '',
          rejectedReason: '',
          submittedAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      transaction.set(
        profileRef,
        {
          talentVerificationStatus: 'pending',
          profileCompletenessScore: completeness.score,
          profileCompletenessChecklist: completeness.checklist,
          updatedAt: now,
        },
        { merge: true }
      );
    });
    await writeAuditLog({
      action: 'talent_verification_submitted',
      actor,
      targetId: actor.uid,
      targetType: 'talent',
      metadata: { profileCompletenessScore: completeness.score },
    });
    await deliverNotifications(async () => {
      await Promise.all([
        createNotification({
          recipientId: actor.uid,
          recipientRole: 'TALENT',
          type: 'talent_verification_submitted',
          title: 'Verification submitted',
          message:
            'Your Talent profile is now in the trust and safety review queue.',
          relatedEntityType: 'verification',
          relatedEntityId: actor.uid,
          actionUrl: '/talent/profile',
          createdBy: actor.uid,
        }),
        notifyAdmins({
          type: 'talent_verification_submitted',
          title: 'Talent verification request',
          message: `${actor.email ?? 'A Talent member'} submitted a profile for review.`,
          relatedEntityType: 'verification',
          relatedEntityId: actor.uid,
          actionUrl: '/admin/talents',
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
