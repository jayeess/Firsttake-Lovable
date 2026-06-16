'use client';

import type { ReactNode } from 'react';
import { AdminStatusBadge, type AdminStatusTone } from './admin-ui';

export type AdminAuditLogEntry = {
  id: string;
  action?: string | null;
  actorEmail?: string | null;
  actorUid?: string | null;
  targetId?: string | null;
  targetUid?: string | null;
  targetType?: string | null;
  reason?: string | null;
  note?: string | null;
  timestamp?: unknown;
  createdAt?: unknown;
};

export const getAuditActionTone = (action?: string | null): AdminStatusTone => {
  const normalized = action?.toLowerCase() ?? '';
  if (
    normalized.includes('reject') ||
    normalized.includes('suspend') ||
    normalized.includes('remove') ||
    normalized.includes('block') ||
    normalized.includes('hide') ||
    normalized.includes('disable')
  ) {
    return 'danger';
  }
  if (
    normalized.includes('approve') ||
    normalized.includes('verify') ||
    normalized.includes('restore') ||
    normalized.includes('resolve')
  ) {
    return 'success';
  }
  if (normalized.includes('review') || normalized.includes('submit')) {
    return 'attention';
  }
  return 'neutral';
};

export function AdminAuditLogList({
  logs,
  compact = false,
}: {
  logs: AdminAuditLogEntry[];
  compact?: boolean;
}) {
  return (
    <div className="surface divide-y divide-[#e0e6e9] overflow-hidden rounded-md">
      <div className="hidden bg-[#e8eff2] px-5 py-3 text-[10px] font-black uppercase tracking-normal text-[#657176] lg:grid lg:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1fr)_minmax(190px,1fr)_minmax(240px,1.5fr)_minmax(120px,0.8fr)] lg:gap-4">
        <span>Action</span>
        <span>Actor</span>
        <span>Target</span>
        <span>Note</span>
        <span>Time</span>
      </div>
      {logs.map((log) => (
        <AdminAuditLogItem key={log.id} log={log} compact={compact} />
      ))}
    </div>
  );
}

export function AdminAuditLogItem({
  log,
  compact = false,
}: {
  log: AdminAuditLogEntry;
  compact?: boolean;
}) {
  const actor = log.actorEmail || log.actorUid || 'Admin';
  const target = log.targetId || log.targetUid || 'Unknown target';
  const note = log.reason || log.note || 'No note supplied';
  const time = formatAuditTime(log.timestamp ?? log.createdAt);
  const action = log.action || 'admin_action';

  return (
    <article
      className={`grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1fr)_minmax(190px,1fr)_minmax(240px,1.5fr)_minmax(120px,0.8fr)] lg:items-start lg:gap-4 ${
        compact ? 'lg:py-4' : ''
      }`}
    >
      <AuditCell label="Action">
        <AdminStatusBadge tone={getAuditActionTone(action)}>
          {formatAction(action)}
        </AdminStatusBadge>
        {log.targetType && (
          <p className="mt-2 text-[11px] font-bold uppercase text-[#89969c]">
            {formatAction(log.targetType)}
          </p>
        )}
      </AuditCell>
      <AuditCell label="Actor">
        <p title={actor} className="truncate text-sm font-bold text-[#1e3038]">
          {actor}
        </p>
      </AuditCell>
      <AuditCell label="Target">
        <p
          title={target}
          aria-label={`Target ${target}`}
          className="max-w-full truncate font-mono text-xs font-bold text-[#526874]"
        >
          {target}
        </p>
      </AuditCell>
      <AuditCell label="Note">
        <p
          className={`text-sm leading-6 ${
            note === 'No note supplied' ? 'text-[#8a969c]' : 'text-[#3d5560]'
          }`}
        >
          {note}
        </p>
      </AuditCell>
      <AuditCell label="Time">
        <p className="text-sm font-bold text-[#657176]">{time}</p>
      </AuditCell>
    </article>
  );
}

function AuditCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-black uppercase text-[#839199] lg:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}

function formatAction(value: string) {
  return value.split('_').join(' ');
}

function formatAuditTime(value: unknown) {
  const date = coerceDate(value);
  if (!date) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function coerceDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    const seconds =
      '_seconds' in value && typeof value._seconds === 'number'
        ? value._seconds
        : 'seconds' in value && typeof value.seconds === 'number'
          ? value.seconds
          : null;
    if (seconds !== null) {
      return new Date(seconds * 1000);
    }
  }
  return null;
}
