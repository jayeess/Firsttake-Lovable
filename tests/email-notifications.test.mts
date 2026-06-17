import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canSendEmailForCategory,
  getEmailCategoryForNotification,
  normalizeNotificationPreferences,
} from '../app/lib/notification-preferences.ts';
import { buildNotificationEmail } from '../app/lib/email/email-templates.ts';
import {
  getEmailProviderStatus,
  sendEmail,
} from '../app/lib/email/email-provider.ts';

test('notification email preferences default to transactional on and marketing off', () => {
  const preferences = normalizeNotificationPreferences();
  assert.equal(preferences.emailEnabled, true);
  assert.equal(preferences.messageEmails, true);
  assert.equal(preferences.applicationUpdateEmails, true);
  assert.equal(preferences.verificationEmails, true);
  assert.equal(preferences.selfTapeEmails, true);
  assert.equal(preferences.safetyEmails, true);
  assert.equal(preferences.marketingEmails, false);
});

test('notification types map only critical events to email categories', () => {
  assert.equal(getEmailCategoryForNotification('new_message'), 'message');
  assert.equal(
    getEmailCategoryForNotification('application_selected'),
    'application'
  );
  assert.equal(getEmailCategoryForNotification('self_tape_submitted'), 'selfTape');
  assert.equal(
    getEmailCategoryForNotification('recruiter_verification_rejected'),
    'verification'
  );
  assert.equal(getEmailCategoryForNotification('report_resolved'), 'safety');
  assert.equal(getEmailCategoryForNotification('application_submitted'), null);
});

test('email preference policy allows safety while respecting user opt-outs', () => {
  assert.equal(
    canSendEmailForCategory({ emailEnabled: false }, 'message'),
    false
  );
  assert.equal(
    canSendEmailForCategory({ emailEnabled: false }, 'application'),
    false
  );
  assert.equal(
    canSendEmailForCategory({ emailEnabled: false }, 'safety'),
    true
  );
  assert.equal(
    canSendEmailForCategory({ messageEmails: false }, 'message'),
    false
  );
});

test('email templates use safe app links and safety footer', () => {
  const email = buildNotificationEmail({
    appBaseUrl: 'https://firsttake-lovable.vercel.app',
    notification: {
      recipientId: 'talent-a',
      recipientRole: 'TALENT',
      type: 'application_selected',
      title: 'You have been selected',
      message: 'The recruiter may contact you with next steps.',
      actionUrl: '/applications',
      createdBy: 'recruiter-a',
    },
  });
  assert.match(email.subject, /Nata Connect/);
  assert.match(email.text, /https:\/\/firsttake-lovable\.vercel\.app\/applications/);
  assert.match(email.text, /never pay to audition/);
  assert.doesNotMatch(email.text, /undefined/);
});

test('email provider stays in no-op mode without configured provider values', async () => {
  const status = getEmailProviderStatus({});
  assert.equal(status.provider, 'none');
  assert.equal(status.configured, false);
  const result = await sendEmail(
    {
      to: 'talent@example.com',
      subject: 'Test',
      text: 'Test',
    },
    {}
  );
  assert.deepEqual(result, { status: 'noop', provider: 'none' });
});

test('email provider reports missing names without exposing values', () => {
  const status = getEmailProviderStatus({
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 'secret-value',
  });
  assert.equal(status.configured, false);
  assert.deepEqual(status.missing, ['EMAIL_FROM']);
  assert.equal(JSON.stringify(status).includes('secret-value'), false);
});
