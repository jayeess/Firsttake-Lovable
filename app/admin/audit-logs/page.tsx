'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Filter, ShieldAlert } from 'lucide-react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminAuditLogList,
  formatAuditActionLabel,
  getAuditActionTone,
  type AdminAuditLogEntry,
} from '@/components/admin-audit-log';
import {
  MetricCard,
  SectionHeader,
  WorkspaceHero,
} from '@/components/product-ui';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void fetchAdminData<{ logs: AdminAuditLogEntry[] }>('auditLogs')
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const actions = useMemo(
    () =>
      Array.from(
        new Set(
          logs
            .map((log) => log.action)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [logs]
  );
  const filtered = logs.filter((log) => !action || log.action === action);
  const enforcementCount = logs.filter(
    (log) => getAuditActionTone(log.action) === 'danger'
  ).length;

  return (
    <AdminShell>
      <WorkspaceHero
        eyebrow="Audit history"
        title="Readable history for every privileged action."
        description="Review who acted, what changed, which profile or audition was affected, and why the decision was made."
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total events" value={logs.length} icon={Activity} />
        <MetricCard
          label="Action types"
          value={actions.length}
          detail="Unique operations"
          icon={Filter}
        />
        <MetricCard
          label="Enforcement events"
          value={enforcementCount}
          tone={enforcementCount > 0 ? 'danger' : 'success'}
          detail="Suspend/remove/block/hide"
          icon={ShieldAlert}
        />
      </section>
      <div className="surface mt-6 rounded-md p-4">
        <SectionHeader
          eyebrow="Review history"
          title="Filter admin actions"
          description="Use action filters to inspect verification, moderation, account safety, and restoration decisions."
        />
        <label className="text-xs font-black uppercase text-[#5c6c73]">
          <span className="sr-only">Filter by action</span>
          <select
            className="field mt-4 max-w-sm normal-case"
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            <option value="">All actions</option>
            {actions.map((value) => (
              <option key={value} value={value}>
                {formatAuditActionLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, check admin access and network status."
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
        <div className="mt-6">
          <AdminAuditLogList logs={filtered} />
        </div>
      ) : null}
    </AdminShell>
  );
}
