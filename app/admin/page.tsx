'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminData } from '@/app/lib/admin-client';
import { ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminAuditLogList,
  type AdminAuditLogEntry,
} from '@/components/admin-audit-log';
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
} from '@/components/admin-ui';

type Overview = {
  stats: Record<string, number>;
  logs: AdminAuditLogEntry[];
};

const labels: Record<string, string> = {
  totalUsers: 'Total users',
  talents: 'Talent accounts',
  recruiters: 'Recruiters',
  pendingVerifications: 'Pending verification',
  pendingTalentVerifications: 'Pending Talent checks',
  approvedRecruiters: 'Approved recruiters',
  suspendedUsers: 'Suspended users',
  activeAuditions: 'Active auditions',
  totalApplications: 'Applications',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void fetchAdminData<Overview>('overview')
      .then(setData)
      .catch((err) => setError(err.message));
  }, [reloadKey]);

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Trust command centre"
        title="Platform integrity at a glance."
        description="Review pending work, moderation pressure, account health, and recent privileged actions from one controlled workspace."
      />
      {error && (
        <ErrorState
          title="Admin data is unavailable"
          message="The secure service could not load platform data. Confirm this account still has the admin claim, then retry."
          onRetry={() => {
            setError('');
            setData(null);
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {!data && !error ? (
        <LoadingState label="Loading trust signals..." />
      ) : data ? (
        <>
          <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              label="Pending recruiter checks"
              value={data.stats.pendingVerifications ?? 0}
              detail="Needs admin review"
              tone={(data.stats.pendingVerifications ?? 0) > 0 ? 'attention' : 'success'}
              href="/admin/verifications"
            />
            <AdminMetricCard
              label="Pending Talent checks"
              value={data.stats.pendingTalentVerifications ?? 0}
              detail="Trust queue"
              tone={(data.stats.pendingTalentVerifications ?? 0) > 0 ? 'attention' : 'success'}
              href="/admin/talents"
            />
            <AdminMetricCard
              label="Suspended users"
              value={data.stats.suspendedUsers ?? 0}
              detail="Restricted accounts"
              tone={(data.stats.suspendedUsers ?? 0) > 0 ? 'danger' : 'success'}
              href="/admin/users"
            />
            <AdminMetricCard
              label="Active auditions"
              value={data.stats.activeAuditions ?? 0}
              detail="Visible casting calls"
              href="/admin/auditions"
            />
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface rounded-md p-5">
              <p className="eyebrow">Needs attention first</p>
              <div className="mt-4 grid gap-3">
                {[
                  ['Recruiter verifications', data.stats.pendingVerifications ?? 0, '/admin/verifications'],
                  ['Talent verifications', data.stats.pendingTalentVerifications ?? 0, '/admin/talents'],
                  ['Suspended users', data.stats.suspendedUsers ?? 0, '/admin/users'],
                ].map(([label, value, href]) => (
                  <Link
                    key={label}
                    href={String(href)}
                    className="flex items-center justify-between gap-4 rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-4 hover:border-[#008ca6]"
                  >
                    <span>
                      <span className="block font-black">{label}</span>
                      <span className="mt-1 block text-sm text-[#657176]">
                        {Number(value) > 0
                          ? 'Open queue and make a decision.'
                          : 'No urgent work in this queue.'}
                      </span>
                    </span>
                    <AdminStatusBadge tone={Number(value) > 0 ? 'attention' : 'success'}>
                      {String(value)}
                    </AdminStatusBadge>
                  </Link>
                ))}
              </div>
            </div>

            <div className="surface rounded-md p-5">
              <p className="eyebrow">Queue summary</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(data.stats).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-[#d8e2e6] p-3">
                    <p className="text-xs font-bold uppercase text-[#657176]">
                      {labels[key] ?? key}
                    </p>
                    <p className="mt-1 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="surface mt-7 rounded-md">
            <div className="flex flex-col gap-2 border-b border-[#d9e1e5] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">Recent audit activity</p>
                <h2 className="mt-2 text-xl font-black">Latest privileged actions</h2>
              </div>
              <Link href="/admin/audit-logs" className="text-sm font-black text-[#008ca6]">
                View all logs
              </Link>
            </div>
            {data.logs.length === 0 ? (
              <AdminEmptyState
                title="No privileged actions recorded"
                message="Approval, suspension, restoration, and moderation activity will appear here."
              />
            ) : (
              <AdminAuditLogList logs={data.logs} compact />
            )}
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
