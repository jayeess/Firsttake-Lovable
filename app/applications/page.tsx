'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { getTalentApplications } from '@/app/lib/firestore-service';
import {
  formatDate,
  type Application,
  type ApplicationStatus,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

const tabs: Array<ApplicationStatus | 'ALL'> = [
  'ALL',
  'APPLIED',
  'VIEWED',
  'SHORTLISTED',
  'REJECTED',
];

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    void getTalentApplications(user.uid)
      .then(setApplications)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load applications'))
      );
  }, [user]);

  const filtered = useMemo(
    () => applications.filter((item) => tab === 'ALL' || item.status === tab),
    [applications, tab]
  );

  return (
    <AppShell>
      <p className="text-sm font-bold uppercase text-[#2e75b6]">
        Application tracker
      </p>
      <h1 className="mt-1 text-3xl font-bold">My applications</h1>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[#ccd3da]">
        {tabs.map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`min-h-11 whitespace-nowrap px-4 text-sm font-semibold ${
              tab === value
                ? 'border-b-2 border-[#2e75b6] text-[#1f5f91]'
                : 'text-[#66717c]'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      {error && <p className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-[#b8c1ca] bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No applications here yet</h2>
            <p className="mt-2 text-[#68727c]">Browse auditions and submit your profile for a role.</p>
          </div>
        ) : (
          filtered.map((application) => (
            <article key={`${application.auditionId}-${application.id}`} className="border border-[#d9dee5] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{application.audition?.title ?? 'Audition'}</h2>
                  <p className="mt-1 text-sm text-[#68727c]">
                    {application.audition?.recruiterName ?? 'Recruiter'} · Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {['APPLIED', 'VIEWED', 'SHORTLISTED', 'REJECTED'].map((status) => (
                  <div key={status} className={`h-1.5 ${status === application.status ? 'bg-[#2e75b6]' : 'bg-[#dce2e8]'}`} />
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
