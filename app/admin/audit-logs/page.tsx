'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminInfo,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

type LogRow = {
  id: string;
  action?: string;
  actorEmail?: string;
  actorUid?: string;
  targetId?: string;
  reason?: string;
  note?: string;
};

const actionTone = (action?: string): AdminStatusTone =>
  action?.includes('reject') ||
  action?.includes('suspend') ||
  action?.includes('remove') ||
  action?.includes('block') ||
  action?.includes('hide')
    ? 'danger'
    : action?.includes('approve') ||
        action?.includes('verify') ||
        action?.includes('restore')
      ? 'success'
      : 'neutral';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void fetchAdminData<{ logs: LogRow[] }>('auditLogs')
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const actions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))),
    [logs]
  );
  const filtered = logs.filter((log) => !action || log.action === action);
  const enforcementCount = logs.filter(
    (log) => actionTone(log.action) === 'danger'
  ).length;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Privileged history"
        title="Audit logs"
        description="Review admin actions by actor, target, and note. This page is the operating history for verification, moderation, and account safety decisions."
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Total events" value={logs.length} />
        <AdminMetricCard
          label="Action types"
          value={actions.length}
          detail="Unique operations"
        />
        <AdminMetricCard
          label="Enforcement events"
          value={enforcementCount}
          tone={enforcementCount > 0 ? 'danger' : 'success'}
          detail="Suspend/remove/block/hide"
        />
      </section>
      <div className="surface mt-6 rounded-md p-4">
        <label className="text-xs font-black uppercase text-[#5c6c73]">
          Filter by action
          <select
            className="field mt-2 max-w-sm normal-case"
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            <option value="">All actions</option>
            {actions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <ErrorState
          title="Audit history could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {loading ? (
        <LoadingState label="Loading privileged action history..." />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="No audit events recorded"
          message="Privileged admin actions will appear here with their actor and target."
        />
      ) : !error ? (
        <div className="surface mt-6 divide-y divide-[#e0e6e9]">
          {filtered.map((log) => (
            <article
              key={log.id}
              className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_2fr]"
            >
              <div>
                <AdminStatusBadge tone={actionTone(log.action)}>
                  {log.action}
                </AdminStatusBadge>
                <dl className="mt-3">
                  <AdminInfo
                    label="Actor"
                    value={log.actorEmail || log.actorUid}
                  />
                </dl>
              </div>
              <AdminInfo label="Target" value={log.targetId} />
              <p className="text-sm leading-6 text-[#526874]">
                {log.reason || log.note || 'No note supplied'}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
