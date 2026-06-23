import type {
  ApplicationStatus,
  Conversation,
  NotificationRole,
} from './types';
import type { NotificationInput } from './notification-policy';

export const MESSAGE_MAX_LENGTH = 1000;

export const getConversationId = (auditionId: string, talentId: string) =>
  `${auditionId}__${talentId}`.replace(/[^A-Za-z0-9_-]/g, '_');

export const hasDirectContactDetails = (value: string) => {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\s().-]*){8,}/;
  return email.test(value) || phone.test(value);
};

export const validateMessageBody = (value: string): string | null => {
  const body = value.trim();
  if (!body) return 'Write a message before sending.';
  if (body.length > MESSAGE_MAX_LENGTH) {
    return `Messages must be ${MESSAGE_MAX_LENGTH.toLocaleString('en')} characters or fewer.`;
  }
  if (hasDirectContactDetails(body)) {
    return 'Keep communication inside Nata Connect. Remove contact details such as email addresses and phone numbers.';
  }
  return null;
};

export const sanitizeMessageBody = (value: string) =>
  value.trim().replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n');

export const canUseApplicationConversation = ({
  applicationStatus,
  recruiterApproved,
  recruiterActive,
  talentActive,
}: {
  applicationStatus: ApplicationStatus;
  recruiterApproved: boolean;
  recruiterActive: boolean;
  talentActive: boolean;
}) =>
  applicationStatus !== 'WITHDRAWN' &&
  recruiterApproved &&
  recruiterActive &&
  talentActive;

export const getUnreadByAfterSend = (
  participantIds: string[],
  senderId: string
) => participantIds.filter((participantId) => participantId !== senderId);

export const buildConversationNotification = ({
  type,
  recipientId,
  recipientRole,
  senderId,
  conversationId,
  auditionTitle,
  preview,
}: {
  type: 'conversation_started' | 'new_message';
  recipientId: string;
  recipientRole: NotificationRole;
  senderId: string;
  conversationId: string;
  auditionTitle: string;
  preview?: string;
}): NotificationInput => ({
  recipientId,
  recipientRole,
  type,
  title: type === 'conversation_started' ? 'Casting conversation started' : 'New message',
  message:
    type === 'conversation_started'
      ? `A casting conversation was opened for ${auditionTitle}. Open it to ask questions or discuss next steps.`
      : `${preview?.slice(0, 120) || 'You received a new message about a casting call.'}`,
  relatedEntityType: 'conversation',
  relatedEntityId: conversationId,
  actionUrl: `/messages/${conversationId}`,
  createdBy: senderId,
  priority: type === 'new_message' ? 'HIGH' : 'NORMAL',
});

export const isConversationParticipant = (
  conversation: Pick<Conversation, 'participantIds'>,
  uid: string
) => conversation.participantIds.includes(uid);
