import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildApplicationSubmittedNotifications,
  buildApplicationStatusNotification,
  buildNotificationRecord,
  getNotificationDocumentId,
  normalizeNotificationActionUrl,
} from '../app/lib/notification-policy.ts';

test('notification action URLs accept only internal application paths', () => {
  assert.equal(normalizeNotificationActionUrl('/applications'), '/applications');
  assert.equal(normalizeNotificationActionUrl('https://example.com'), undefined);
  assert.equal(normalizeNotificationActionUrl('//example.com/path'), undefined);
});

test('notification records use safe defaults and omit undefined metadata', () => {
  const record = buildNotificationRecord({
    recipientId: 'talent-a',
    recipientRole: 'TALENT',
    type: 'application_shortlisted',
    title: '  Shortlisted  ',
    message: '  The recruiter shortlisted your application.  ',
    actionUrl: '/applications',
    createdBy: 'recruiter-a',
    metadata: { status: 'SHORTLISTED', optional: undefined },
  });

  assert.equal(record.title, 'Shortlisted');
  assert.equal(record.message, 'The recruiter shortlisted your application.');
  assert.equal(record.priority, 'NORMAL');
  assert.deepEqual(record.metadata, { status: 'SHORTLISTED' });
  assert.equal(record.read, false);
});

test('dedupe IDs are stable without exposing the source key', () => {
  const first = getNotificationDocumentId('application:audition-a:talent-a');
  const second = getNotificationDocumentId('application:audition-a:talent-a');
  assert.equal(first, second);
  assert.equal(first?.length, 40);
  assert.notEqual(first, 'application:audition-a:talent-a');
});

test('application submission prepares one Talent and one Recruiter notification', () => {
  const notifications = buildApplicationSubmittedNotifications({
    talentId: 'talent-a',
    recruiterId: 'recruiter-a',
    auditionId: 'audition-a',
    auditionTitle: 'Lead role',
  });

  assert.equal(notifications.length, 2);
  assert.deepEqual(
    notifications.map((item) => item.recipientRole),
    ['TALENT', 'RECRUITER']
  );
  assert.equal(notifications[0].actionUrl, '/applications');
  assert.equal(
    notifications[1].actionUrl,
    '/recruiter/auditions/audition-a/applicants'
  );
});

test('user-facing casting decisions notify Talent without exposing internal reviews', () => {
  const shortlisted = buildApplicationStatusNotification({
    talentId: 'talent-a',
    recruiterId: 'recruiter-a',
    auditionId: 'audition-a',
    auditionTitle: 'Lead role',
    status: 'SHORTLISTED',
  });
  const selected = buildApplicationStatusNotification({
    talentId: 'talent-a',
    recruiterId: 'recruiter-a',
    auditionId: 'audition-a',
    auditionTitle: 'Lead role',
    status: 'SELECTED',
  });
  const internal = buildApplicationStatusNotification({
    talentId: 'talent-a',
    recruiterId: 'recruiter-a',
    auditionId: 'audition-a',
    auditionTitle: 'Lead role',
    status: 'UNDER_REVIEW',
  });

  assert.equal(shortlisted?.type, 'application_shortlisted');
  assert.equal(selected?.type, 'application_selected');
  assert.equal(selected?.priority, 'HIGH');
  assert.equal(internal, null);
});
