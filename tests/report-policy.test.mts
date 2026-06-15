import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReportNotifications,
  getReportPriority,
  getReportResolution,
  isDuplicateReport,
  isReportReasonCode,
  isReportTargetType,
  normalizeReportReasonText,
  sanitizeEvidenceSnapshot,
  sanitizeEvidenceText,
} from '../app/lib/report-policy.ts';

test('report target and reason validation accepts only supported values', () => {
  assert.equal(isReportTargetType('audition'), true);
  assert.equal(isReportTargetType('password'), false);
  assert.equal(isReportReasonCode('scam_or_fraud'), true);
  assert.equal(isReportReasonCode('dislike'), false);
  assert.equal(
    normalizeReportReasonText('  Helpful context  ', 'harassment'),
    'Helpful context'
  );
  assert.throws(
    () => normalizeReportReasonText('short', 'other'),
    /at least 10 characters/
  );
});

test('evidence sanitizer redacts contact details and excludes private fields', () => {
  assert.equal(
    sanitizeEvidenceText('Email me at test@example.com or +971 50 123 4567'),
    'Email me at [email redacted] or [phone redacted]'
  );
  assert.deepEqual(
    sanitizeEvidenceSnapshot(
      {
        title: 'Casting call',
        email: 'private@example.com',
        phone: '+971501234567',
        recruiterNote: 'private note',
        status: 'ACTIVE',
      },
      ['title', 'email', 'phone', 'recruiterNote', 'status']
    ),
    { title: 'Casting call', status: 'ACTIVE' }
  );
});

test('priority assignment escalates fraud and unsafe contact reports', () => {
  assert.equal(getReportPriority('scam_or_fraud'), 'high');
  assert.equal(getReportPriority('unsafe_contact_request'), 'high');
  assert.equal(getReportPriority('inappropriate_content'), 'medium');
  assert.equal(getReportPriority('spam'), 'low');
});

test('duplicate report helper applies only to recent active reports', () => {
  const now = Date.now();
  assert.equal(
    isDuplicateReport({ status: 'open', createdAt: now - 1000, now }),
    true
  );
  assert.equal(
    isDuplicateReport({
      status: 'resolved',
      createdAt: now - 1000,
      now,
    }),
    false
  );
  assert.equal(
    isDuplicateReport({
      status: 'open',
      createdAt: now - 25 * 60 * 60 * 1000,
      now,
    }),
    false
  );
});

test('report notifications remain generic and route admins to the queue', () => {
  const notifications = buildReportNotifications({
    reportId: 'report-a',
    reporterId: 'talent-a',
    reporterRole: 'TALENT',
    targetType: 'message',
  });
  assert.equal(notifications.reporter.type, 'report_received');
  assert.equal(notifications.reporter.actionUrl, '/notifications');
  assert.equal(notifications.admin.actionUrl, '/admin/reports');
  assert.equal(notifications.admin.type, 'report_submitted_admin_alert');
});

test('admin resolution helper closes or dismisses reports with bounded notes', () => {
  assert.deepEqual(
    getReportResolution({ action: 'dismiss_report', note: 'No violation' }),
    {
      status: 'dismissed',
      resolutionAction: 'dismiss_report',
      resolutionNote: 'No violation',
    }
  );
  assert.equal(
    getReportResolution({ action: 'hide_reported_message' }).status,
    'resolved'
  );
});
