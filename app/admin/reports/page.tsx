'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import {
  REPORT_REASON_CODES,
  REPORT_REASON_LABELS,
  REPORT_TARGET_TYPES,
} from '@/app/lib/report-policy';
import type {
  AbuseReport,
  ReportPriority,
  ReportReasonCode,
  ReportStatus,
  ReportTargetType,
} from '@/app/lib/types';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminActionGroup,
  AdminDangerActionGroup,
  AdminInfo,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

type ReportEvent = {
  id: string;
  actorId: string;
  action: string;
  note?: string;
};

type AdminReport = AbuseReport & { events?: ReportEvent[] };

const statusOptions: Array<'all' | ReportStatus> = [
  'all',
  'open',
  'under_review',
  'resolved',
  'dismissed',
];
const priorityOptions: Array<'all' | ReportPriority> = [
  'all',
  'urgent',
  'high',
  'medium',
  'low',
];

const badgeTone = (value: string): AdminStatusTone =>
  value === 'urgent' || value === 'high' || value === 'open'
    ? 'danger'
    : value === 'resolved' || value === 'dismissed'
      ? 'success'
      : value === 'under_review'
        ? 'attention'
        : 'neutral';

const actionForTarget = (report: AdminReport) => {
  if (report.targetType === 'audition') {
    return ['remove_reported_audition', 'Remove audition'] as const;
  }
  if (report.targetType === 'media') {
    return ['hide_reported_media', 'Hide media'] as const;
  }
  if (['publicProfile', 'talentProfile'].includes(report.targetType)) {
    return ['disable_reported_public_profile', 'Disable public profile'] as const;
  }
  if (report.targetType === 'conversation') {
    return ['block_reported_conversation', 'Block conversation'] as const;
  }
  if (report.targetType === 'message') {
    return ['hide_reported_message', 'Hide message'] as const;
  }
  if (['recruiter', 'talent'].includes(report.targetType)) {
    return ['suspend_reported_user', 'Suspend user'] as const;
  }
  return null;
};

export default function AdminReportsPage() {
  const [items, setItems] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'all' | ReportStatus>('open');
  const [targetType, setTargetType] = useState<'all' | ReportTargetType>('all');
  const [reasonCode, setReasonCode] =
    useState<'all' | ReportReasonCode>('all');
  const [priority, setPriority] = useState<'all' | ReportPriority>('all');

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminData<{ reports: AdminReport[] }>('reports')
      .then((data) => setItems(data.reports))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Reports could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (status === 'all' || item.status === status) &&
          (targetType === 'all' || item.targetType === targetType) &&
          (reasonCode === 'all' || item.reasonCode === reasonCode) &&
          (priority === 'all' || item.priority === priority)
      ),
    [items, priority, reasonCode, status, targetType]
  );

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Trust moderation"
        title="Report queue"
        description="Review private abuse reports, inspect minimal evidence, and apply proportionate platform actions. Reporter identity stays inside this administrator workspace."
      />

      <div className="surface mt-7 grid gap-3 rounded-md p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Filter
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
        <Filter
          label="Target"
          value={targetType}
          onChange={setTargetType}
          options={['all', ...REPORT_TARGET_TYPES]}
        />
        <Filter
          label="Reason"
          value={reasonCode}
          onChange={setReasonCode}
          options={['all', ...REPORT_REASON_CODES]}
          labels={REPORT_REASON_LABELS}
        />
        <Filter
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
        />
      </div>

      {error && (
        <ErrorState
          title="Reports could not be loaded"
          message={error}
          onRetry={() => {
            setError('');
            load();
          }}
        />
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <LoadingState label="Loading private reports..." />
        ) : !error && filtered.length === 0 ? (
          <EmptyState
            title={
              status === 'open'
                ? 'No open reports right now'
                : 'No reports match these filters'
            }
            message="Open safety concerns will appear here as they are submitted."
          />
        ) : (
          filtered.map((report) => {
            const targetAction = actionForTarget(report);
            const closed = ['resolved', 'dismissed'].includes(report.status);
            const restoreAction =
              report.resolutionAction === 'remove_reported_audition'
                ? (['restore_reported_audition', 'Restore audition'] as const)
                : report.resolutionAction === 'suspend_reported_user'
                  ? (['restore_reported_user', 'Restore user'] as const)
                  : null;
            return (
              <article key={report.id} className="surface p-5 sm:p-6">
                <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusBadge tone={badgeTone(report.priority)}>
                        {report.priority}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone={badgeTone(report.status)}>
                        {report.status}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="muted">
                        {report.targetType}
                      </AdminStatusBadge>
                    </div>
                    <h2 className="mt-3 text-xl font-black">
                      {REPORT_REASON_LABELS[report.reasonCode]}
                    </h2>
                    <p className="mt-2 text-sm text-[#657176]">
                      Target: {report.targetId}
                    </p>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <AdminInfo
                        label="Reporter"
                        value={`${report.reporterRole} / ${report.reporterId}`}
                      />
                      <AdminInfo
                        label="Target owner"
                        value={report.targetOwnerId ?? 'Not available'}
                      />
                    </dl>
                  </div>
                  {!closed ? (
                    <div className="grid gap-3">
                      <AdminActionGroup title="Case handling">
                        {report.status === 'open' && (
                          <AdminActionButton
                            action="review_report"
                            targetId={report.id}
                            label="Start review"
                            tone="secondary"
                            onComplete={load}
                          />
                        )}
                        <AdminActionButton
                          action="resolve_report"
                          targetId={report.id}
                          label="Resolve without action"
                          tone="secondary"
                          onComplete={load}
                        />
                        <AdminActionButton
                          action="dismiss_report"
                          targetId={report.id}
                          label="Dismiss"
                          tone="secondary"
                          onComplete={load}
                        />
                      </AdminActionGroup>
                      {targetAction && (
                        <AdminDangerActionGroup title="Target enforcement">
                          <AdminActionButton
                            action={targetAction[0]}
                            targetId={report.id}
                            label={targetAction[1]}
                            tone="danger"
                            onComplete={load}
                          />
                        </AdminDangerActionGroup>
                      )}
                    </div>
                  ) : restoreAction ? (
                    <AdminActionGroup title="Restoration">
                      <AdminActionButton
                        action={restoreAction[0]}
                        targetId={report.id}
                        label={restoreAction[1]}
                        tone="secondary"
                        onComplete={load}
                      />
                    </AdminActionGroup>
                  ) : null}
                </div>

                {report.reasonText && (
                  <div className="mt-5 border-l-2 border-[#e7ad2d] bg-[#fffaf0] p-4 text-sm leading-6">
                    {report.reasonText}
                  </div>
                )}

                <details className="mt-5 border border-[#d7e0e4] bg-[#f7fafb] p-4">
                  <summary className="cursor-pointer text-sm font-black">
                    Safe evidence snapshot
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-[#52636b]">
                    {JSON.stringify(report.evidenceSnapshots, null, 2)}
                  </pre>
                </details>

                {(report.events?.length ?? 0) > 0 && (
                  <details className="mt-3 border border-[#d7e0e4] p-4">
                    <summary className="cursor-pointer text-sm font-black">
                      Audit trail ({report.events?.length})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {report.events?.map((event) => (
                        <p key={event.id} className="text-xs text-[#607078]">
                          <strong>{event.action}</strong> by {event.actorId}
                          {event.note ? `: ${event.note}` : ''}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            );
          })
        )}
      </div>
    </AdminShell>
  );
}

function Filter<T extends string>({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <label className="text-xs font-black uppercase text-[#5c6c73]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="field mt-2 normal-case"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ??
              option
                .split('_')
                .join(' ')
                .replace(/^\w/, (letter) => letter.toUpperCase())}
          </option>
        ))}
      </select>
    </label>
  );
}
