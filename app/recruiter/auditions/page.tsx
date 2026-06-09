'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { getRecruiterAuditions } from '@/app/lib/firestore-service';
import { formatDate, type Audition } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

export default function RecruiterAuditionsPage() {
  const { user } = useAuth();
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    void getRecruiterAuditions(user.uid)
      .then(setAuditions)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load your auditions'))
      );
  }, [user]);

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase text-[#008ca6]">Recruiter tools</p><h1 className="mt-1 text-3xl font-bold">My auditions</h1></div>
        <Link href="/recruiter/auditions/new" className="bg-[#008ca6] px-5 py-3 font-semibold text-white">Post audition</Link>
      </div>
      {error && <p className="mt-5 border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="mt-6 overflow-x-auto border border-[#d9dee5] bg-white">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-[#eef2f5] text-xs uppercase text-[#64707b]">
            <tr><th className="p-4">Audition</th><th className="p-4">Status</th><th className="p-4">Deadline</th><th className="p-4">Applicants</th><th className="p-4">Action</th></tr>
          </thead>
          <tbody>
            {auditions.map((audition) => (
              <tr key={audition.id} className="border-t border-[#e1e5ea]">
                <td className="p-4 font-semibold">{audition.title}</td>
                <td className="p-4"><StatusBadge status={audition.status} /></td>
                <td className="p-4 text-sm">{formatDate(audition.deadline)}</td>
                <td className="p-4 text-sm">
                  <Link
                    href={`/recruiter/auditions/${audition.id}/applicants`}
                    className="font-semibold text-[#008ca6]"
                  >
                    {audition.applicantCount}{' '}
                    {audition.applicantCount === 1 ? 'applicant' : 'applicants'}
                  </Link>
                </td>
                <td className="p-4"><Link href={`/auditions/${audition.id}`} className="text-sm font-semibold text-[#1f5f91]">View brief</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditions.length === 0 && <p className="p-8 text-center text-[#68727c]">No auditions posted yet.</p>}
      </div>
    </AppShell>
  );
}
