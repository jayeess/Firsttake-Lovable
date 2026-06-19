import { createHash } from 'node:crypto';
import type {
  ApplicationStatus,
  NotificationPriority,
  NotificationRole,
  NotificationType,
} from './types';

export type NotificationInput = {
  recipientId: string;
  recipientRole: NotificationRole;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?:
    | 'application'
    | 'audition'
    | 'verification'
    | 'user'
    | 'media'
    | 'public_profile'
    | 'conversation'
    | 'report';
  relatedEntityId?: string;
  actionUrl?: string;
  createdBy: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

export const normalizeNotificationActionUrl = (
  actionUrl?: string
): string | undefined => {
  if (!actionUrl) return undefined;
  const trimmed = actionUrl.trim();
  return trimmed.startsWith('/') && !trimmed.startsWith('//')
    ? trimmed
    : undefined;
};

export const getNotificationDocumentId = (
  dedupeKey?: string
): string | undefined => {
  if (!dedupeKey) return undefined;
  return createHash('sha256').update(dedupeKey).digest('hex').slice(0, 40);
};

export const buildNotificationRecord = (input: NotificationInput) => ({
  recipientId: input.recipientId,
  recipientRole: input.recipientRole,
  type: input.type,
  title: input.title.trim().slice(0, 140),
  message: input.message.trim().slice(0, 600),
  relatedEntityType: input.relatedEntityType ?? null,
  relatedEntityId: input.relatedEntityId ?? null,
  actionUrl: normalizeNotificationActionUrl(input.actionUrl) ?? null,
  read: false,
  createdBy: input.createdBy,
  priority: input.priority ?? 'NORMAL',
  metadata: Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(([, value]) => value !== undefined)
  ),
});

export const buildApplicationSubmittedNotifications = ({
  talentId,
  recruiterId,
  auditionId,
  auditionTitle,
}: {
  talentId: string;
  recruiterId: string;
  auditionId: string;
  auditionTitle: string;
}): NotificationInput[] => [
  {
    recipientId: talentId,
    recipientRole: 'TALENT',
    type: 'application_submitted',
    title: 'Application submitted',
    message: `Your application for ${auditionTitle} was sent successfully.`,
    relatedEntityType: 'application',
    relatedEntityId: `${auditionId}/${talentId}`,
    actionUrl: '/applications',
    createdBy: talentId,
    dedupeKey: `application-submitted:talent:${auditionId}:${talentId}`,
  },
  {
    recipientId: recruiterId,
    recipientRole: 'RECRUITER',
    type: 'application_submitted',
    title: 'New audition application',
    message: `A Talent member applied for ${auditionTitle}.`,
    relatedEntityType: 'application',
    relatedEntityId: `${auditionId}/${talentId}`,
    actionUrl: `/recruiter/auditions/${auditionId}/applicants`,
    createdBy: talentId,
    priority: 'HIGH',
    dedupeKey: `application-submitted:recruiter:${auditionId}:${talentId}`,
  },
];

export const buildApplicationStatusNotification = ({
  talentId,
  recruiterId,
  auditionId,
  auditionTitle,
  status,
}: {
  talentId: string;
  recruiterId: string;
  auditionId: string;
  auditionTitle: string;
  status: ApplicationStatus;
}): NotificationInput | null => {
  const messages: Partial<
    Record<
      ApplicationStatus,
      Pick<NotificationInput, 'type' | 'title' | 'message' | 'priority'>
    >
  > = {
    VIEWED: {
      type: 'application_viewed',
      title: 'Your application was viewed',
      message: `A recruiter opened your application for ${auditionTitle}.`,
      priority: 'NORMAL',
    },
    SHORTLISTED: {
      type: 'application_shortlisted',
      title: 'You were shortlisted',
      message: `You were shortlisted for ${auditionTitle}.`,
      priority: 'HIGH',
    },
    CALLBACK: {
      type: 'application_callback',
      title: 'Callback requested',
      message: `You may be contacted for another round for ${auditionTitle}.`,
      priority: 'HIGH',
    },
    FINAL_ROUND: {
      type: 'application_final_round',
      title: 'You moved to Final Round',
      message: `You moved to the final review stage for ${auditionTitle}.`,
      priority: 'HIGH',
    },
    REJECTED: {
      type: 'application_rejected',
      title: 'Application update',
      message: `This role moved forward with someone else for ${auditionTitle}.`,
      priority: 'NORMAL',
    },
    SELECTED: {
      type: 'application_selected',
      title: 'You have been selected',
      message: `You have been selected for ${auditionTitle}. The recruiter may contact you with next steps.`,
      priority: 'HIGH',
    },
  };
  const content = messages[status];
  if (!content) return null;

  return {
    recipientId: talentId,
    recipientRole: 'TALENT',
    ...content,
    relatedEntityType: 'application',
    relatedEntityId: `${auditionId}/${talentId}`,
    actionUrl: '/applications',
    createdBy: recruiterId,
    dedupeKey: `application-status:${auditionId}:${talentId}:${status}`,
    metadata: { status },
  };
};
