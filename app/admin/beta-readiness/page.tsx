'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminShell } from '@/components/admin-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminInfo,
  AdminPageHeader,
  AdminStatusBadge,
} from '@/components/admin-ui';

type BetaReadinessData = {
  checks: Record<string, boolean | number>;
  env: {
    public: { ok: boolean; missing: string[]; present: string[] };
    server: { ok: boolean; missing: string[]; present: string[] };
  };
};

const checklist = [
  ['firebaseProjectConnected', 'Firebase project connected', 'System check'],
  ['firestoreReachable', 'Firestore is reachable', 'System check'],
  ['adminSdkConfigured', 'Admin SDK configured', 'Server env'],
  ['publicFirebaseConfigured', 'Firebase web env configured', 'Public env'],
  ['adminUserExists', 'Admin user exists', 'System check'],
  ['recruiterVerificationEnabled', 'Recruiter verification enabled', 'Feature'],
  ['talentVerificationEnabled', 'Talent verification enabled', 'Feature'],
  ['publicProfilesEnabled', 'Public profiles enabled', 'Feature'],
  ['messagingEnabled', 'Messaging enabled', 'Feature'],
  ['reportsEnabled', 'Reports and moderation enabled', 'Feature'],
  ['notificationsEnabled', 'Notifications enabled', 'Feature'],
  ['indexesDocumented', 'Required indexes documented', 'Deployment'],
  ['manualQaChecklist', 'Manual QA checklist status', 'Launch ops'],
  ['deploymentNotes', 'Last deployment notes documented', 'Launch ops'],
] as const;

const staticReady = new Set([
  'publicProfilesEnabled',
  'messagingEnabled',
  'reportsEnabled',
  'notificationsEnabled',
  'indexesDocumented',
  'manualQaChecklist',
  'deploymentNotes',
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

export default function AdminBetaReadinessPage() {
  const [data, setData] = useState<BetaReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminData<BetaReadinessData>('betaReadiness')
      .then(setData)
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Beta readiness checks could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const readyCount = useMemo(() => {
    if (!data) return 0;
    return checklist.filter(([key]) =>
      staticReady.has(key) ? true : data.checks[key] === true
    ).length;
  }, [data]);

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Production beta readiness"
        title="Launch control checklist"
        description="Confirm the production Firebase connection, admin operations, and manual launch workflow before inviting real beta users."
      />

      {error && (
        <ErrorState
          title="Readiness checks could not run"
          message="The admin service could not load beta readiness data. Confirm the admin claim and Admin SDK configuration, then retry."
          onRetry={() => {
            setError('');
            load();
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Checking production beta readiness..." />
      ) : data ? (
        <>
          <section className="surface mt-7 p-6">
            <p className="eyebrow">Readiness score</p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <p className="text-5xl font-black">
                {readyCount}/{checklist.length}
              </p>
              <p className="pb-2 text-sm font-bold text-[#657176]">
                checks ready for a controlled beta.
              </p>
            </div>
            {(!data.env.public.ok || !data.env.server.ok) && (
              <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                Missing env names:{' '}
                {[...data.env.public.missing, ...data.env.server.missing].join(', ')}
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checklist.map(([key, title, group]) => {
              const ok = staticReady.has(key) ? true : data.checks[key] === true;
              return (
                <article key={key} className="surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-[#008ca6]">
                        {group}
                      </p>
                      <h2 className="mt-2 font-black">{title}</h2>
                    </div>
                    <AdminStatusBadge tone={ok ? 'success' : 'attention'}>
                      {ok ? 'Ready' : 'Needs check'}
                    </AdminStatusBadge>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="surface mt-7 p-6">
            <p className="eyebrow">Launch review areas</p>
            <h2 className="mt-2 text-2xl font-black">Manual beta checklist</h2>
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              {launchAreas.map(([title, description]) => (
                <AdminInfo key={title} label={title} value={description} />
              ))}
            </dl>
          </section>

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
