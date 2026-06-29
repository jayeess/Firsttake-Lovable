'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import {
  getLaunchReadinessSummary,
  type LaunchReadinessBand,
} from '@/app/lib/launch-readiness-policy';
import { AdminShell } from '@/components/admin-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminInfo,
  AdminPageHeader,
  AdminStatusBadge,
} from '@/components/admin-ui';

type LaunchReadinessData = {
  checks: Record<string, boolean | number>;
  stats: {
    totalUsers: number;
    talents: number;
    recruiters: number;
    pendingVerifications: number;
    pendingTalentVerifications: number;
    approvedRecruiters: number;
    suspendedUsers: number;
    activeAuditions: number;
    totalApplications: number;
    selfTapeRequests: number;
    selfTapeSubmissions: number;
  };
  reports: {
    openCount: number;
    urgentCount: number;
  };
  env: {
    public: { ok: boolean; missing: string[]; present: string[] };
    server: { ok: boolean; missing: string[]; present: string[] };
    email?: {
      provider: string;
      configured: boolean;
      missing: string[];
      replyToConfigured: boolean;
    };
  };
};

const BAND_LABEL: Record<LaunchReadinessBand, string> = {
  blocked: 'Blocked',
  needs_attention: 'Needs attention',
  almost_ready: 'Almost ready',
  ready: 'Ready for controlled launch',
};

const BAND_TONE: Record<
  LaunchReadinessBand,
  'success' | 'attention' | 'danger'
> = {
  blocked: 'danger',
  needs_attention: 'attention',
  almost_ready: 'attention',
  ready: 'success',
};

const BAND_DESCRIPTION: Record<LaunchReadinessBand, string> = {
  blocked:
    'Critical infrastructure checks are failing. The platform cannot operate until these are resolved.',
  needs_attention:
    'Significant gaps remain. Address these issues before inviting real users.',
  almost_ready:
    'Core infrastructure is sound. Address remaining gaps before the controlled launch.',
  ready: 'All critical checks pass. The platform is ready for a controlled launch.',
};

const infraChecklist = [
  ['firebaseProjectConnected', 'Firebase project connected', 'System'],
  ['firestoreReachable', 'Firestore reachable', 'System'],
  ['adminSdkConfigured', 'Admin SDK configured', 'Server env'],
  ['publicFirebaseConfigured', 'Firebase web env configured', 'Public env'],
  ['adminUserExists', 'Admin user exists', 'System'],
  ['emailProviderConfigured', 'Email provider configured', 'Server env'],
  ['emailDeliveryModeSafe', 'Email delivery mode safe', 'Server env'],
] as const;

const featureChecklist = [
  ['recruiterVerificationEnabled', 'Recruiter verification enabled', 'Feature'],
  ['talentVerificationEnabled', 'Talent verification enabled', 'Feature'],
  [
    'emailNotificationFoundationAdded',
    'Email notification foundation added',
    'Feature',
  ],
  [
    'notificationPreferencesEnabled',
    'Notification preferences enabled',
    'Feature',
  ],
  ['pwaManifestAdded', 'PWA manifest added', 'Mobile'],
] as const;

const staticReady = new Set([
  'recruiterVerificationEnabled',
  'talentVerificationEnabled',
  'emailNotificationFoundationAdded',
  'notificationPreferencesEnabled',
  'pwaManifestAdded',
  'emailDeliveryModeSafe',
]);

const operations = [
  [
    'Recruiter verification',
    'Open Verifications, review business proof, approve legitimate casting teams, reject unclear submissions with a concise reason.',
  ],
  [
    'Talent trust',
    'Open Talent trust, review completeness, media, and public profile posture before approving, rejecting, suspending, or restoring.',
  ],
  [
    'Audition moderation',
    'Open Auditions, remove suspicious casting calls, restore only after the recruiter fixes the issue, and keep notes generic.',
  ],
  [
    'Media moderation',
    'Use Talent trust or Reports to hide/remove unsafe media. Never publish private identity documents or internal notes.',
  ],
  [
    'Report handling',
    'Open Reports, start review, inspect the sanitized snapshot, act on the target, then resolve or dismiss with an internal note.',
  ],
  [
    'Conversation safety',
    'Block conversations that show harassment, unsafe contact pressure, scams, or off-platform payment requests.',
  ],
  [
    'Account suspension',
    'Suspend only when content or conduct creates platform risk. Restore only after evidence is clear and documented.',
  ],
  [
    'Escalation',
    'Do not share reporter identity publicly. If legal, safety, or payment risk appears, pause the account/content and preserve audit logs.',
  ],
] as const;

const launchAreas = [
  [
    'Production status',
    'Confirm Vercel production is on the latest commit and Firebase rules/indexes match the deployed code.',
  ],
  [
    'Firebase',
    'Check Auth providers, Firestore rules, indexes, Storage rules, admin claims, and service account env configuration.',
  ],
  [
    'Vercel',
    'Verify public Firebase env vars, server-only Admin SDK env vars, Node runtime, and production build logs.',
  ],
  [
    'Auth and security',
    'Retest signed-out redirects, role routes, admin-only APIs, custom claims, and account suspension flows.',
  ],
  [
    'Content and legal',
    'Prepare report handling guidance, prohibited content language, privacy copy, and escalation process.',
  ],
  [
    'Support',
    'Define a support inbox, response owner, launch-day monitoring window, and rollback contact.',
  ],
  [
    'User testing',
    'Run one Talent journey, one Recruiter journey, one admin verification journey, and one report moderation journey.',
  ],
  [
    'Known limitations',
    'Document unfinished automation, manual verification steps, and any beta-only restrictions before inviting users.',
  ],
] as const;

const manualReadinessGroups = [
  {
    title: 'Production foundation',
    items: [
      'Vercel production deployed',
      'Firebase production connected',
      'Admin dashboard working',
      'Mobile UX checked',
      'Admin UX checked',
    ],
  },
  {
    title: 'Legal and policy readiness',
    items: [
      'Terms page added',
      'Privacy page added',
      'Community Guidelines added',
      'Safety page added',
      'Final legal review still required',
    ],
  },
  {
    title: 'Support readiness',
    items: [
      'Contact page added',
      'Help page added',
      'Beta feedback page added',
      'Support workflow and owner defined before launch',
    ],
  },
  {
    title: 'Trust and safety readiness',
    items: [
      'Recruiter verification active',
      'Talent verification active',
      'Reports and moderation active',
      'Audit logs active',
      'Safety warnings visible',
    ],
  },
  {
    title: 'Beta user readiness',
    items: [
      'Demo Talent account tested',
      'Demo Recruiter account tested',
      'Sample audition tested',
      'Sample application tested',
      'Messaging and reports tested',
      'Email no-op flow tested',
      'PWA installability checked on mobile',
    ],
  },
  {
    title: 'Launch limitations',
    items: [
      'Custom domain may still be pending',
      'Full legal review pending',
      'Real email delivery pending unless provider env is configured',
      'Push notifications are not implemented yet',
      'Analytics and monitoring improvements pending',
      'Payments are not implemented',
    ],
  },
] as const;

export default function LaunchReadinessCommandCenter() {
  const [data, setData] = useState<LaunchReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminData<LaunchReadinessData>('launchReadiness')
      .then(setData)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Launch readiness data could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const summary = useMemo(
    () => (data ? getLaunchReadinessSummary(data) : null),
    [data]
  );

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Production launch readiness"
        title="Launch Readiness Command Center"
        description="Real-time platform health, infrastructure status, marketplace supply, and safety queue — all from one view."
      />

      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, check admin access and launch configuration."
          onRetry={() => {
            setError('');
            load();
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Checking launch readiness..." />
      ) : data && summary ? (
        <>
          {/* ── Band & Score ─────────────────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Readiness score</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="text-5xl font-black">{summary.score}%</p>
              <AdminStatusBadge tone={BAND_TONE[summary.band]}>
                {BAND_LABEL[summary.band]}
              </AdminStatusBadge>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#d7e0e4]">
              <div
                className="h-2 rounded-full bg-[#008ca6] transition-all"
                style={{ width: `${summary.score}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#657176]">
              {BAND_DESCRIPTION[summary.band]}
            </p>
          </section>

          {/* ── Blockers ─────────────────────────────────────────────────── */}
          {summary.blockers.length > 0 && (
            <section className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-5">
              <p className="text-sm font-black text-amber-900">
                {summary.blockers.length === 1
                  ? '1 issue needs attention'
                  : `${summary.blockers.length} issues need attention`}
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {summary.blockers.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-3 rounded-md border border-amber-200 bg-white p-3"
                  >
                    <span
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        item.status === 'blocked'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-amber-900">
                        {item.label}
                      </p>
                      {item.detail && (
                        <p className="mt-0.5 text-xs leading-5 text-amber-800">
                          {item.detail}
                        </p>
                      )}
                      {item.actionHref && (
                        <Link
                          href={item.actionHref}
                          className="mt-1 block text-xs font-black text-[#008ca6] hover:underline"
                        >
                          Take action →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Env warnings ─────────────────────────────────────────────── */}
          {(!data.env.public.ok || !data.env.server.ok) && (
            <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p className="font-black">Missing environment variables</p>
              <p className="mt-1">
                {[...data.env.public.missing, ...data.env.server.missing].join(
                  ', '
                )}
              </p>
            </div>
          )}

          {/* ── Marketplace health ───────────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Marketplace health</p>
            <h2 className="mt-2 text-2xl font-black">
              Real-time platform signals
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#657176]">
              Live counts from Firestore. These signals directly affect launch
              readiness — no approved recruiters or active auditions means the
              marketplace is empty for talent.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {/* Recruiter pipeline */}
              <article className="rounded-md border border-[#d7e0e4] p-4">
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  Recruiter pipeline
                </p>
                <dl className="mt-3 grid gap-2">
                  <StatRow
                    label="Approved recruiters"
                    value={data.stats.approvedRecruiters}
                    href="/admin/verifications"
                    tone={data.stats.approvedRecruiters > 0 ? 'success' : 'danger'}
                  />
                  <StatRow
                    label="Pending verification"
                    value={data.stats.pendingVerifications}
                    href="/admin/verifications"
                    tone={
                      data.stats.pendingVerifications > 0
                        ? 'attention'
                        : 'success'
                    }
                  />
                  <StatRow
                    label="Total recruiters"
                    value={data.stats.recruiters}
                  />
                </dl>
              </article>

              {/* Talent */}
              <article className="rounded-md border border-[#d7e0e4] p-4">
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  Talent
                </p>
                <dl className="mt-3 grid gap-2">
                  <StatRow
                    label="Talent accounts"
                    value={data.stats.talents}
                  />
                  <StatRow
                    label="Pending trust checks"
                    value={data.stats.pendingTalentVerifications}
                    href="/admin/talents"
                    tone={
                      data.stats.pendingTalentVerifications > 0
                        ? 'attention'
                        : 'success'
                    }
                  />
                  <StatRow
                    label="Total users"
                    value={data.stats.totalUsers}
                  />
                </dl>
              </article>

              {/* Casting supply */}
              <article className="rounded-md border border-[#d7e0e4] p-4">
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  Casting supply
                </p>
                <dl className="mt-3 grid gap-2">
                  <StatRow
                    label="Active auditions"
                    value={data.stats.activeAuditions}
                    href="/admin/auditions"
                    tone={
                      data.stats.activeAuditions > 0 ? 'success' : 'danger'
                    }
                  />
                  <StatRow
                    label="Total applications"
                    value={data.stats.totalApplications}
                  />
                  <StatRow
                    label="Self-tape requests"
                    value={data.stats.selfTapeRequests}
                  />
                </dl>
              </article>
            </div>
          </section>

          {/* ── Safety queue ─────────────────────────────────────────────── */}
          <section className="surface mt-6 p-6">
            <p className="eyebrow">Safety queue</p>
            <h2 className="mt-2 text-2xl font-black">Trust and moderation</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Open reports"
                value={data.reports.openCount}
                href="/admin/reports"
                tone={data.reports.openCount > 0 ? 'attention' : 'success'}
                detail="Awaiting admin review"
              />
              <StatCard
                label="Urgent reports"
                value={data.reports.urgentCount}
                href="/admin/reports"
                tone={data.reports.urgentCount > 0 ? 'danger' : 'success'}
                detail="Scam, fraud, or unsafe contact"
              />
              <StatCard
                label="Suspended accounts"
                value={data.stats.suspendedUsers}
                href="/admin/users"
                tone={data.stats.suspendedUsers > 0 ? 'attention' : 'success'}
                detail="Restricted from platform"
              />
            </div>
          </section>

          {/* ── Infrastructure checks ────────────────────────────────────── */}
          <section className="surface mt-6 p-6">
            <p className="eyebrow">Infrastructure checks</p>
            <h2 className="mt-2 text-2xl font-black">System and environment</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {infraChecklist.map(([key, title, group]) => {
                const ok = staticReady.has(key)
                  ? true
                  : data.checks[key] === true;
                return (
                  <article key={key} className="border border-[#d7e0e4] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase text-[#008ca6]">
                          {group}
                        </p>
                        <h3 className="mt-1 font-black">{title}</h3>
                      </div>
                      <AdminStatusBadge tone={ok ? 'success' : 'danger'}>
                        {ok ? 'Ready' : 'Blocked'}
                      </AdminStatusBadge>
                    </div>
                  </article>
                );
              })}
              {featureChecklist.map(([key, title, group]) => {
                const ok = staticReady.has(key)
                  ? true
                  : data.checks[key] === true;
                return (
                  <article key={key} className="border border-[#d7e0e4] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase text-[#008ca6]">
                          {group}
                        </p>
                        <h3 className="mt-1 font-black">{title}</h3>
                      </div>
                      <AdminStatusBadge tone={ok ? 'success' : 'attention'}>
                        {ok ? 'Ready' : 'Pending'}
                      </AdminStatusBadge>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ── Launch review areas ──────────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Launch review areas</p>
            <h2 className="mt-2 text-2xl font-black">Manual beta checklist</h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              {launchAreas.map(([title, description]) => (
                <AdminInfo key={title} label={title} value={description} />
              ))}
            </dl>
          </section>

          {/* ── Admin operations guide ───────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Admin operations guide</p>
            <h2 className="mt-2 text-2xl font-black">Safe beta workflows</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {operations.map(([title, description]) => (
                <article key={title} className="border border-[#d7e0e4] p-4">
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#657176]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ── Manual launch control ────────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Manual launch control</p>
            <h2 className="mt-2 text-2xl font-black">
              Beta readiness checklist
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#657176]">
              These are manual launch checks. They should be confirmed by the
              team before inviting real beta users; they are not automated legal
              or compliance guarantees.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {manualReadinessGroups.map((group) => (
                <article key={group.title} className="border border-[#d7e0e4] p-4">
                  <h3 className="font-black">{group.title}</h3>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#526874]">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="font-black text-[#008ca6]">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* ── Production commands ──────────────────────────────────────── */}
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Production commands</p>
            <pre className="mt-4 overflow-x-auto bg-[#07111f] p-4 text-xs leading-6 text-white">
{`npm run lint
npm test
npm run build
npm run emulators:test
npm run test:e2e
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod`}
            </pre>
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}

function StatRow({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: 'success' | 'attention' | 'danger';
}) {
  const content = (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-sm text-[#526874]">{label}</dt>
      <dd>
        <AdminStatusBadge tone={tone ?? 'success'}>{value}</AdminStatusBadge>
      </dd>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}

function StatCard({
  label,
  value,
  href,
  tone,
  detail,
}: {
  label: string;
  value: number;
  href?: string;
  tone?: 'success' | 'attention' | 'danger';
  detail?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-black">{label}</p>
        {detail && (
          <p className="mt-0.5 text-xs text-[#657176]">{detail}</p>
        )}
        <p className="mt-2 text-3xl font-black">{value}</p>
      </div>
      <AdminStatusBadge tone={tone ?? 'success'}>
        {value === 0 ? 'Clear' : 'Review'}
      </AdminStatusBadge>
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-md border border-[#d7e0e4] p-4 hover:border-[#008ca6]"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-md border border-[#d7e0e4] p-4">{inner}</div>;
}
