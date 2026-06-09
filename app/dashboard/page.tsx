'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  getRecruiterAuditions,
  getTalentApplications,
  getTalentProfile,
} from '@/app/lib/firestore-service';
import type { Application, Audition } from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';

export default function Dashboard() {
  const { user, userType, loading, error } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    if (!user || !userType) return;
    if (userType === 'TALENT') {
      void Promise.all([
        getTalentApplications(user.uid).catch(() => []),
        getTalentProfile(user.uid).catch(() => null),
      ]).then(([items, profile]) => {
        setApplications(items);
        setFirstName(profile?.firstName ?? '');
      });
    } else if (userType === 'RECRUITER') {
      void getRecruiterAuditions(user.uid)
        .then(setAuditions)
        .catch(() => setAuditions([]));
    }
  }, [user, userType]);

  const talentStats = useMemo(
    () => [
      ['Applications', applications.length],
      ['Viewed', applications.filter((item) => item.status === 'VIEWED').length],
      ['Shortlisted', applications.filter((item) => item.status === 'SHORTLISTED').length],
    ],
    [applications]
  );

  const recruiterStats = useMemo(
    () => [
      ['Auditions posted', auditions.length],
      ['Active auditions', auditions.filter((item) => item.status === 'ACTIVE').length],
      ['Total applicants', auditions.reduce((sum, item) => sum + (item.applicantCount || 0), 0)],
    ],
    [auditions]
  );

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-[#2e75b6]">
            {userType === 'RECRUITER' ? 'Recruiter workspace' : 'Talent workspace'}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-2 text-[#68727c]">{user?.email}</p>
        </div>
        <Link
          href={userType === 'RECRUITER' ? '/recruiter/auditions/new' : '/auditions'}
          className="bg-[#2e75b6] px-5 py-3 font-semibold text-white"
        >
          {userType === 'RECRUITER' ? 'Post an audition' : 'Browse auditions'}
        </Link>
      </div>

      {error && (
        <p className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </p>
      )}

      {!user?.emailVerified && (
        <p className="mt-6 border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
          Verify your email from the Firebase message sent to your inbox.
        </p>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {(userType === 'RECRUITER' ? recruiterStats : talentStats).map(
          ([label, value]) => (
            <article key={label} className="border border-[#d9dee5] bg-white p-5">
              <p className="text-sm font-semibold text-[#68727c]">{label}</p>
              <p className="mt-2 text-3xl font-bold text-[#26323d]">{value}</p>
            </article>
          )
        )}
      </section>

      <section className="mt-7 border border-[#d9dee5] bg-white">
        <div className="flex items-center justify-between border-b border-[#e1e5ea] p-5">
          <h2 className="text-xl font-bold">
            {userType === 'RECRUITER' ? 'Recent auditions' : 'Recent applications'}
          </h2>
          <Link
            href={userType === 'RECRUITER' ? '/recruiter/auditions' : '/applications'}
            className="text-sm font-semibold text-[#1f5f91]"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#e1e5ea]">
          {userType === 'RECRUITER'
            ? auditions.slice(0, 5).map((audition) => (
                <div key={audition.id} className="flex items-center justify-between gap-4 p-5">
                  <div><p className="font-semibold">{audition.title}</p><p className="mt-1 text-sm text-[#68727c]">{audition.applicantCount} applicants</p></div>
                  <StatusBadge status={audition.status} />
                </div>
              ))
            : applications.slice(0, 5).map((application) => (
                <div key={`${application.auditionId}-${application.id}`} className="flex items-center justify-between gap-4 p-5">
                  <div><p className="font-semibold">{application.audition?.title ?? 'Audition'}</p><p className="mt-1 text-sm text-[#68727c]">{application.audition?.recruiterName ?? 'Recruiter'}</p></div>
                  <StatusBadge status={application.status} />
                </div>
              ))}
          {(userType === 'RECRUITER' ? auditions : applications).length === 0 && (
            <p className="p-8 text-center text-[#68727c]">
              No activity yet. Use the primary action above to get started.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
