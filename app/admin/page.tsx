'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminData } from '@/app/lib/admin-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';

type Overview = {
  stats: Record<string, number>;
  logs: Array<Record<string, unknown>>;
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
      <p className="eyebrow">Trust command centre</p>
      <h1 className="mt-2 text-4xl font-black">Platform integrity at a glance.</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657176]">
        Review recruiter trust, account health, and casting activity from one
        controlled workspace.
      </p>
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
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(data.stats).map(([key, value]) => (
              <article key={key} className="surface p-5">
                <p className="text-sm font-bold text-[#657176]">{labels[key] ?? key}</p>
                <p className="mt-3 text-4xl font-black">{value}</p>
              </article>
            ))}
          </section>
          <section className="surface mt-7">
            <div className="border-b border-[#d9e1e5] p-5">
              <p className="eyebrow">Recent audit activity</p>
            </div>
            {data.logs.length === 0 ? (
              <EmptyState
                title="No privileged actions recorded"
                message="Approval, suspension, restoration, and moderation activity will appear here."
              />
            ) : (
              <div className="divide-y divide-[#e1e7ea]">
                {data.logs.map((log) => (
                  <div key={String(log.id)} className="p-5">
                    <p className="font-black">{String(log.action)}</p>
                    <p className="mt-1 text-sm text-[#657176]">
                      Target: {String(log.targetId ?? log.targetUid ?? 'Unknown')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
