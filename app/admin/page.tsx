'use client';

import Link from 'next/link';
import {
  Activity,
  ClipboardCheck,
  FileText,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
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
  AdminStatusBadge,
} from '@/components/admin-ui';
import {
  MetricCard,
  SafetyNotice,
  SectionHeader,
  WorkspaceHero,
} from '@/components/product-ui';

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
  selfTapeRequests: 'Self-tape auditions',
  selfTapeSubmissions: 'Self-tapes submitted',
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
      <WorkspaceHero
        eyebrow="Trust command center"
        title="Platform integrity at a glance."
        description="Review verification queues, moderation pressure, account health, and recent privileged actions from one controlled workspace."
        actionHref="/admin/audit-logs"
        actionLabel="View audit logs"
        secondaryHref="/admin/reports"
        secondaryLabel="Open reports"
      />
      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, confirm this account still has admin access."
          onRetry={() => {
            setError('');
            setData(null);
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {!data && !error ? (
        <LoadingState label="Loading trust operations..." />
      ) : data ? (
        <>
          <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Pending recruiter checks"
              value={data.stats.pendingVerifications ?? 0}
              detail="Needs admin review"
              icon={UserCheck}
              tone={(data.stats.pendingVerifications ?? 0) > 0 ? 'attention' : 'success'}
            />
            <MetricCard
              label="Pending Talent checks"
              value={data.stats.pendingTalentVerifications ?? 0}
              detail="Trust queue"
              icon={ClipboardCheck}
              tone={(data.stats.pendingTalentVerifications ?? 0) > 0 ? 'attention' : 'success'}
            />
            <MetricCard
              label="Flagged accounts"
              value={data.stats.suspendedUsers ?? 0}
              detail="Restricted accounts"
              icon={ShieldAlert}
              tone={(data.stats.suspendedUsers ?? 0) > 0 ? 'danger' : 'success'}
            />
            <MetricCard
              label="Active auditions"
              value={data.stats.activeAuditions ?? 0}
              detail="Visible casting calls"
              icon={FileText}
            />
          </section>

          <section className="mt-6">
            <SafetyNotice title="Admin operating principle" icon={ShieldAlert}>
              Keep profile completeness, verification, moderation, and account
              safety decisions separate. Every action should be traceable and
              proportionate.
            </SafetyNotice>
          </section>

          <section className="mt-7 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="surface rounded-md p-5">
              <SectionHeader
                eyebrow="Verification queue"
                title="Needs attention first"
                description="Open the queues where an admin decision can unblock users or reduce marketplace risk."
              />
              <div className="mt-4 grid gap-3">
                {[
                  ['Recruiter verifications', data.stats.pendingVerifications ?? 0, '/admin/verifications'],
                  ['Talent verifications', data.stats.pendingTalentVerifications ?? 0, '/admin/talents'],
                  ['Flagged accounts', data.stats.suspendedUsers ?? 0, '/admin/users'],
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
              <SectionHeader
                eyebrow="Platform trust"
                title="Operational summary"
                description="A compact scan of users, auditions, applications, and trust workflows."
              />
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

          <section className="mt-7 grid gap-4 lg:grid-cols-3">
            <MetricCard
              label="Recent audit actions"
              value={data.logs.length}
              detail="Latest privileged events loaded"
              icon={Activity}
            />
            <MetricCard
              label="Total users"
              value={data.stats.totalUsers ?? 0}
              detail="Talent, Recruiter, and Admin records"
              icon={Users}
            />
            <MetricCard
              label="Applications"
              value={data.stats.totalApplications ?? 0}
              detail="Casting activity across roles"
              icon={ClipboardCheck}
            />
          </section>

          <section className="surface mt-6 rounded-md p-5">
            <SectionHeader
              eyebrow="Private beta operations"
              title="Beta control center"
              description="Monitor feedback, review readiness, and run admin checks during the controlled rollout."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Beta feedback',
                  body: 'Review bugs, confusing flows, and safety signals from testers.',
                  href: '/admin/beta-feedback',
                  Icon: MessageSquare,
                },
                {
                  label: 'Beta readiness',
                  body: 'Check launch blockers, environment readiness, and rule status.',
                  href: '/admin/beta-readiness',
                  Icon: ClipboardCheck,
                },
                {
                  label: 'Audit logs',
                  body: 'Every privileged admin action traceable by time and actor.',
                  href: '/admin/audit-logs',
                  Icon: Activity,
                },
                {
                  label: 'Reports queue',
                  body: 'Safety and trust reports filed by users during the beta.',
                  href: '/admin/reports',
                  Icon: ShieldAlert,
                },
              ].map(({ label, body, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col gap-2 rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-4 hover:border-[#008ca6]"
                >
                  <Icon className="size-4 text-[#008ca6]" />
                  <p className="font-black">{label}</p>
                  <p className="text-sm leading-5 text-[#657176]">{body}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="surface mt-6 rounded-md">
            <div className="flex flex-col gap-2 border-b border-[#d9e1e5] p-5 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeader
                eyebrow="Recent changes"
                title="Latest privileged actions"
                description="Approvals, suspensions, restorations, moderation, and other admin decisions."
              />
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
