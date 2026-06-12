import { createHash } from 'node:crypto';
import type {
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
  relatedEntityType?: 'application' | 'audition' | 'verification' | 'user';
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
