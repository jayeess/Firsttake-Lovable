import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConversationNotification,
  canUseApplicationConversation,
  getConversationId,
  getUnreadByAfterSend,
  hasDirectContactDetails,
  sanitizeMessageBody,
  validateMessageBody,
} from '../app/lib/messaging-policy.ts';

test('conversation IDs are deterministic and scoped to audition plus Talent', () => {
  assert.equal(
    getConversationId('audition-a', 'talent-a'),
    getConversationId('audition-a', 'talent-a')
  );
  assert.notEqual(
    getConversationId('audition-a', 'talent-a'),
    getConversationId('audition-b', 'talent-a')
  );
});

test('conversation eligibility requires approved active accounts and a live application', () => {
  assert.equal(
    canUseApplicationConversation({
      applicationStatus: 'SHORTLISTED',
      recruiterApproved: true,
      recruiterActive: true,
      talentActive: true,
    }),
    true
  );
  assert.equal(
    canUseApplicationConversation({
      applicationStatus: 'WITHDRAWN',
      recruiterApproved: true,
      recruiterActive: true,
      talentActive: true,
    }),
    false
  );
});

test('message validation blocks empty, oversized, email, and phone content', () => {
  assert.match(validateMessageBody('') ?? '', /Write a message/);
  assert.match(validateMessageBody('x'.repeat(1001)) ?? '', /1,000/);
  assert.equal(hasDirectContactDetails('mail me at test@example.com'), true);
  assert.equal(hasDirectContactDetails('call +971 50 123 4567'), true);
  assert.match(validateMessageBody('test@example.com') ?? '', /contact details/);
  assert.equal(validateMessageBody('Can you share the self-tape deadline?'), null);
});

test('message sanitization and unread state remain participant scoped', () => {
  assert.equal(sanitizeMessageBody(' Hello\r\n\r\n\r\nthere '), 'Hello\n\nthere');
  assert.deepEqual(
    getUnreadByAfterSend(['recruiter-a', 'talent-a'], 'talent-a'),
    ['recruiter-a']
  );
});

test('message notifications point to the private conversation route', () => {
  const notification = buildConversationNotification({
    type: 'new_message',
    recipientId: 'talent-a',
    recipientRole: 'TALENT',
    senderId: 'recruiter-a',
    conversationId: 'audition-a__talent-a',
    auditionTitle: 'Lead role',
    preview: 'Please prepare scene two.',
  });
  assert.equal(notification.type, 'new_message');
  assert.equal(notification.actionUrl, '/messages/audition-a__talent-a');
  assert.equal(notification.recipientId, 'talent-a');
});
