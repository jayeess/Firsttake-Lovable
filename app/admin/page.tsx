'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { fetchAdminData } from '@/app/lib/admin-client';

type Overview = {
  stats: Record<string, number>;
  logs: Array<Record<string, unknown>>;
};

const labels: Record<string, string> = {
  totalUsers: 'Total users',
  talents: 'Talent accounts',
  recruiters: 'Recruiters',
  pendingVerifications: 'Pending verification',
  approvedRecruiters: 'Approved recruiters',
  suspendedUsers: 'Suspended users',
  activeAuditions: 'Active auditions',
  totalApplications: 'Applications',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchAdminData<Overview>('overview').then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <AdminShell>
      <p className="eyebrow">Trust command centre</p>
      <h1 className="mt-2 text-4xl font-black">Platform integrity at a glance.</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657176]">
        Review recruiter trust, account health, and casting activity from one
        controlled workspace.
      </p>
      {error && <ErrorState message={error} />}
      {!data && !error ? (
        <p className="mt-8 font-bold text-[#657176]">Loading trust signals...</p>
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
              <p className="p-8 text-[#657176]">No privileged actions recorded yet.</p>
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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-7 border border-amber-300 bg-amber-50 p-5 text-amber-950">
      <p className="font-black">Admin data is unavailable</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
      <p className="mt-2 text-sm">Check Firebase Admin environment variables and the admin custom claim.</p>
    </div>
  );
}
