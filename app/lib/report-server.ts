import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { AdminRequestError } from './admin-server';
import {
  sanitizeEvidenceSnapshot,
  sanitizeEvidenceText,
} from './report-policy';
import type {
  NotificationRole,
  ReportTargetType,
} from './types';

type ReportTargetContext = {
  targetOwnerId: string | null;
  evidenceSnapshots: Record<string, unknown>;
};

const requireDocument = async (
  promise: Promise<FirebaseFirestore.DocumentSnapshot>,
  message: string
) => {
  const snapshot = await promise;
  if (!snapshot.exists) throw new AdminRequestError(message, 404);
  return snapshot;
};

const getPair = (targetId: string, label: string) => {
  const splitAt = targetId.indexOf(':');
  const first = targetId.slice(0, splitAt).trim();
  const second = targetId.slice(splitAt + 1).trim();
  if (splitAt < 1 || !first || !second) {
    throw new AdminRequestError(`A valid ${label} target is required.`);
  }
  return [first, second] as const;
};

const requireConversationParticipant = (
  data: FirebaseFirestore.DocumentData,
  actor: DecodedIdToken
) => {
  if (
    actor.admin !== true &&
    !(Array.isArray(data.participantIds) && data.participantIds.includes(actor.uid))
  ) {
    throw new AdminRequestError('This conversation is not available to report.', 403);
  }
};

export const getReporterRole = async (
  db: Firestore,
  actor: DecodedIdToken
): Promise<NotificationRole> => {
  if (actor.admin === true) return 'ADMIN';
  const user = await requireDocument(
    db.collection('users').doc(actor.uid).get(),
    'The reporting account could not be confirmed.'
  );
  const role = user.data()?.userType;
  if (role !== 'TALENT' && role !== 'RECRUITER') {
    throw new AdminRequestError('A valid account role is required.', 403);
  }
  if (user.data()?.accountStatus === 'SUSPENDED') {
    throw new AdminRequestError('Suspended accounts cannot submit reports.', 403);
  }
  return role;
};

export const loadReportTarget = async ({
  db,
  actor,
  targetType,
  targetId,
}: {
  db: Firestore;
  actor: DecodedIdToken;
  targetType: ReportTargetType;
  targetId: string;
}): Promise<ReportTargetContext> => {
  if (targetType === 'audition') {
    const target = await requireDocument(
      db.collection('auditions').doc(targetId).get(),
      'Audition was not found.'
    );
    const data = target.data() ?? {};
    return {
      targetOwnerId:
        typeof data.recruiterId === 'string' ? data.recruiterId : null,
      evidenceSnapshots: sanitizeEvidenceSnapshot(data, [
        'title',
        'description',
        'requirements',
        'location',
        'category',
        'status',
        'moderationStatus',
        'recruiterName',
      ]),
    };
  }

  if (targetType === 'publicProfile') {
    const target = await requireDocument(
      db.collection('publicTalentProfiles').doc(targetId).get(),
      'Public Talent profile was not found.'
    );
    const data = target.data() ?? {};
    if (data.enabled !== true) {
      throw new AdminRequestError('Public Talent profile is not available.', 404);
    }
    return {
      targetOwnerId: typeof data.uid === 'string' ? data.uid : null,
      evidenceSnapshots: sanitizeEvidenceSnapshot(data, [
        'slug',
        'displayName',
        'category',
        'experienceLevel',
        'location',
        'bio',
        'talentVerificationStatus',
      ]),
    };
  }

  if (targetType === 'media') {
    const [slug, mediaId] = getPair(targetId, 'public media');
    const profile = await requireDocument(
      db.collection('publicTalentProfiles').doc(slug).get(),
      'Public Talent profile was not found.'
    );
    const data = profile.data() ?? {};
    const media = Array.isArray(data.media)
      ? data.media.find(
          (item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            item.id === mediaId
        )
      : null;
    if (!media || typeof media !== 'object') {
      throw new AdminRequestError('Public media was not found.', 404);
    }
    return {
      targetOwnerId: typeof data.uid === 'string' ? data.uid : null,
      evidenceSnapshots: {
        profileSlug: slug,
        media: sanitizeEvidenceSnapshot(
          media as Record<string, unknown>,
          ['id', 'type', 'title', 'description', 'url']
        ),
      },
    };
  }

  if (targetType === 'conversation') {
    const conversation = await requireDocument(
      db.collection('conversations').doc(targetId).get(),
      'Conversation was not found.'
    );
    const data = conversation.data() ?? {};
    requireConversationParticipant(data, actor);
    const otherParticipant = (data.participantIds as unknown[] | undefined)?.find(
      (uid) => uid !== actor.uid && typeof uid === 'string'
    );
    return {
      targetOwnerId:
        typeof otherParticipant === 'string' ? otherParticipant : null,
      evidenceSnapshots: sanitizeEvidenceSnapshot(data, [
        'auditionId',
        'applicationId',
        'auditionTitleSnapshot',
        'applicationStatus',
        'status',
      ]),
    };
  }

  if (targetType === 'message') {
    const [conversationId, messageId] = getPair(targetId, 'message');
    const conversation = await requireDocument(
      db.collection('conversations').doc(conversationId).get(),
      'Conversation was not found.'
    );
    requireConversationParticipant(conversation.data() ?? {}, actor);
    const message = await requireDocument(
      conversation.ref.collection('messages').doc(messageId).get(),
      'Message was not found.'
    );
    const data = message.data() ?? {};
    return {
      targetOwnerId:
        typeof data.senderId === 'string' ? data.senderId : null,
      evidenceSnapshots: {
        conversationId,
        messageId,
        senderRole: data.senderRole ?? null,
        body: sanitizeEvidenceText(data.body, 1000),
        moderationStatus: data.moderationStatus ?? null,
      },
    };
  }

  if (targetType === 'talentProfile' || targetType === 'talent') {
    const profile = await requireDocument(
      db
        .collection('users')
        .doc(targetId)
        .collection('talentProfiles')
        .doc(targetId)
        .get(),
      'Talent profile was not found.'
    );
    return {
      targetOwnerId: targetId,
      evidenceSnapshots: sanitizeEvidenceSnapshot(profile.data() ?? {}, [
        'firstName',
        'lastName',
        'category',
        'experienceLevel',
        'location',
        'bio',
        'talentVerificationStatus',
        'publicSlug',
      ]),
    };
  }

  const profile = await requireDocument(
    db
      .collection('users')
      .doc(targetId)
      .collection('recruiterProfiles')
      .doc(targetId)
      .get(),
    'Recruiter profile was not found.'
  );
  return {
    targetOwnerId: targetId,
    evidenceSnapshots: sanitizeEvidenceSnapshot(profile.data() ?? {}, [
      'companyName',
      'address',
      'website',
      'bio',
      'isVerified',
      'verificationStatus',
    ]),
  };
};
