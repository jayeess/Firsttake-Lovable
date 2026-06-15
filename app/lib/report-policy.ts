import type { NotificationInput } from './notification-policy';
import type {
  NotificationRole,
  ReportPriority,
  ReportReasonCode,
  ReportStatus,
  ReportTargetType,
} from './types';

export const REPORT_REASON_TEXT_MAX = 1000;
export const REPORT_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const REPORT_TARGET_TYPES: ReportTargetType[] = [
  'audition',
  'talentProfile',
  'publicProfile',
  'media',
  'message',
  'conversation',
  'recruiter',
  'talent',
];

export const REPORT_REASON_CODES: ReportReasonCode[] = [
  'fake_audition',
  'scam_or_fraud',
  'inappropriate_content',
  'harassment',
  'spam',
  'impersonation',
  'unsafe_contact_request',
  'misleading_information',
  'other',
];

export const REPORT_REASON_LABELS: Record<ReportReasonCode, string> = {
  fake_audition: 'Fake audition',
  scam_or_fraud: 'Scam or fraud',
  inappropriate_content: 'Inappropriate content',
  harassment: 'Harassment',
  spam: 'Spam',
  impersonation: 'Impersonation',
  unsafe_contact_request: 'Unsafe contact request',
  misleading_information: 'Misleading information',
  other: 'Other concern',
};

export const isReportTargetType = (
  value: unknown
): value is ReportTargetType =>
  typeof value === 'string' &&
  REPORT_TARGET_TYPES.includes(value as ReportTargetType);

export const isReportReasonCode = (
  value: unknown
): value is ReportReasonCode =>
  typeof value === 'string' &&
  REPORT_REASON_CODES.includes(value as ReportReasonCode);

export const normalizeReportReasonText = (
  value: unknown,
  reasonCode: ReportReasonCode
) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > REPORT_REASON_TEXT_MAX) {
    throw new Error(
      `Report details must be ${REPORT_REASON_TEXT_MAX} characters or fewer.`
    );
  }
  if (reasonCode === 'other' && text.length < 10) {
    throw new Error('Please add at least 10 characters explaining the concern.');
  }
  return text;
};

export const getReportPriority = (
  reasonCode: ReportReasonCode
): ReportPriority => {
  if (
    ['scam_or_fraud', 'harassment', 'unsafe_contact_request'].includes(reasonCode)
  ) {
    return 'high';
  }
  if (
    ['impersonation', 'inappropriate_content', 'fake_audition'].includes(
      reasonCode
    )
  ) {
    return 'medium';
  }
  return 'low';
};

export const sanitizeEvidenceText = (value: unknown, maxLength = 500) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      '[email redacted]'
    )
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone redacted]')
    .trim()
    .slice(0, maxLength);
};

export const sanitizeEvidenceSnapshot = (
  source: Record<string, unknown>,
  allowedFields: string[]
) => {
  const entries: Array<[string, unknown]> = [];
  allowedFields.forEach((field) => {
      const value = source[field];
      if (
        value === undefined ||
        ['email', 'phone', 'adminNote', 'recruiterNote', 'recruiterNotes'].includes(
          field
        )
      ) {
        return;
      }
      if (typeof value === 'string') {
        entries.push([field, sanitizeEvidenceText(value)]);
        return;
      }
      if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        entries.push([field, value]);
        return;
      }
      if (Array.isArray(value)) entries.push([field, value.slice(0, 20)]);
    });
  return Object.fromEntries(entries);
};

export const isDuplicateReport = ({
  status,
  createdAt,
  now = Date.now(),
}: {
  status: ReportStatus;
  createdAt: Date | number;
  now?: number;
}) => {
  if (!['open', 'under_review'].includes(status)) return false;
  const timestamp =
    createdAt instanceof Date ? createdAt.getTime() : Number(createdAt);
  return now - timestamp < REPORT_DUPLICATE_WINDOW_MS;
};

export const buildReportNotifications = ({
  reportId,
  reporterId,
  reporterRole,
  targetType,
}: {
  reportId: string;
  reporterId: string;
  reporterRole: NotificationRole;
  targetType: ReportTargetType;
}): {
  reporter: NotificationInput;
  admin: Omit<NotificationInput, 'recipientId' | 'recipientRole'>;
} => ({
  reporter: {
    recipientId: reporterId,
    recipientRole: reporterRole,
    type: 'report_received',
    title: 'Report received',
    message: 'Your report was received. Our trust team will review it.',
    relatedEntityType: 'report',
    relatedEntityId: reportId,
    actionUrl: '/notifications',
    createdBy: reporterId,
    dedupeKey: `report-received:${reportId}`,
  },
  admin: {
    type: 'report_submitted_admin_alert',
    title: 'New trust report',
    message: `A ${targetType} report is ready for review.`,
    relatedEntityType: 'report',
    relatedEntityId: reportId,
    actionUrl: '/admin/reports',
    createdBy: reporterId,
    priority: 'HIGH',
    dedupeKey: `report-admin-alert:${reportId}`,
  },
});

export const getReportResolution = ({
  action,
  note,
}: {
  action: string;
  note?: string;
}) => ({
  status:
    action === 'dismiss_report'
      ? ('dismissed' as const)
      : ('resolved' as const),
  resolutionAction: action,
  resolutionNote: (note ?? '').trim().slice(0, 1000),
});
