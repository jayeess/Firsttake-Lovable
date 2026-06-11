'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';

type LogRow = {
  id: string;
  action?: string;
  actorEmail?: string;
  actorUid?: string;
  targetId?: string;
  reason?: string;
  note?: string;
};

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

  return (
    <AdminShell>
      <p className="eyebrow">Privileged history</p>
      <h1 className="mt-2 text-4xl font-black">Audit logs</h1>
      <select
        className="field mt-6 max-w-sm"
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
              className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_2fr]"
            >
              <div>
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  {log.action}
                </p>
                <p className="mt-1 text-sm">{log.actorEmail || log.actorUid}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#7a878d]">
                  Target
                </p>
                <p className="mt-1 text-sm">{log.targetId}</p>
              </div>
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
