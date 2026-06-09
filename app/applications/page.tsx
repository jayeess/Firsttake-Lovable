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
  const { user, userType } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userType !== 'TALENT') {
      return;
    }

    void getTalentApplications(user.uid)
      .then(setApplications)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load applications'))
      )
      .finally(() => setLoading(false));
  }, [user, userType]);

  const filtered = useMemo(
    () => applications.filter((item) => tab === 'ALL' || item.status === tab),
    [applications, tab]
  );

  return (
    <AppShell requiredRole="TALENT">
      <p className="eyebrow">Application tracker</p>
      <h1 className="mt-2 text-4xl font-black">My applications</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
        Follow every role from submission through recruiter review and final
        status.
      </p>

      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-[#ccd3da]">
        {tabs.map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`min-h-11 whitespace-nowrap px-4 text-sm font-bold ${
              tab === value
                ? 'border-b-2 border-[#008ca6] text-[#008ca6]'
                : 'text-[#66717c]'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-bold">Applications could not be loaded</p>
          <p className="mt-1">
            {error.includes('index')
              ? 'Please refresh once. This workflow no longer requires a custom Firestore index.'
              : error}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm font-semibold text-[#657176]">
            Loading your applications...
          </p>
        ) : filtered.length === 0 ? (
          <div className="surface border-dashed p-10 text-center">
            <h2 className="text-xl font-black">No applications here yet</h2>
            <p className="mt-2 text-[#68727c]">
              Browse auditions and submit your profile for a role.
            </p>
          </div>
        ) : (
          filtered.map((application) => (
            <article
              key={`${application.auditionId}-${application.id}`}
              className="surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">
                    {application.audition?.title ?? 'Audition'}
                  </h2>
                  <p className="mt-1 text-sm text-[#68727c]">
                    {application.audition?.recruiterName ?? 'Recruiter'} ·
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {['APPLIED', 'VIEWED', 'SHORTLISTED', 'REJECTED'].map(
                  (status) => (
                    <div
                      key={status}
                      className={`h-1.5 ${
                        status === application.status
                          ? 'bg-[#008ca6]'
                          : 'bg-[#dce2e8]'
                      }`}
                    />
                  )
                )}
              </div>
              {application.status === 'REJECTED' &&
                application.rejectionReason && (
                  <p className="mt-4 border-l-2 border-[#e7ad2d] pl-4 text-sm leading-6 text-[#59666b]">
                    <span className="font-bold text-[#07111f]">
                      Recruiter feedback:
                    </span>{' '}
                    {application.rejectionReason}
                  </p>
                )}
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
