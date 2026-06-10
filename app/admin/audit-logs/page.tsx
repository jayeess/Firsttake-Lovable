'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminData } from '@/app/lib/admin-client';

type LogRow = { id: string; action?: string; actorEmail?: string; actorUid?: string; targetId?: string; reason?: string; note?: string; timestamp?: { _seconds?: number } };

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { void fetchAdminData<{ logs: LogRow[] }>('auditLogs').then((data) => setLogs(data.logs)).catch((err) => setError(err.message)); }, []);
  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))), [logs]);
  const filtered = logs.filter((log) => !action || log.action === action);
  return <AdminShell><p className="eyebrow">Privileged history</p><h1 className="mt-2 text-4xl font-black">Audit logs</h1>
    <select className="field mt-6 max-w-sm" value={action} onChange={(e) => setAction(e.target.value)}><option value="">All actions</option>{actions.map((value) => <option key={value} value={value}>{value}</option>)}</select>
    {error && <p className="mt-5 text-red-700">{error}</p>}
    <div className="surface mt-6 divide-y divide-[#e0e6e9]">{filtered.map((log) => <article key={log.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_2fr]"><div><p className="text-xs font-black uppercase text-[#008ca6]">{log.action}</p><p className="mt-1 text-sm">{log.actorEmail || log.actorUid}</p></div><div><p className="text-xs font-black uppercase text-[#7a878d]">Target</p><p className="mt-1 text-sm">{log.targetId}</p></div><p className="text-sm leading-6 text-[#526874]">{log.reason || log.note || 'No note supplied'}</p></article>)}{filtered.length === 0 && <p className="p-8 text-center text-[#657176]">No audit events recorded.</p>}</div>
  </AdminShell>;
}
