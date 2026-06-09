'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  getRecruiterAuditions,
  getRecruiterProfile,
  getTalentApplications,
  getTalentProfile,
} from '@/app/lib/firestore-service';
import type { Application, Audition } from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';
import { hasRecruiterApproval } from '@/app/lib/recruiter-access';

export default function Dashboard() {
  const router = useRouter();
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
      void Promise.all([
        getRecruiterProfile(user.uid).catch(() => null),
        getRecruiterAuditions(user.uid).catch(() => []),
      ]).then(([profile, items]) => {
        if (!profile) {
          router.replace('/recruiter/profile');
          return;
        }
        if (!hasRecruiterApproval(user.uid, profile)) {
          router.replace('/recruiter/verification');
          return;
        }
        setAuditions(items);
      });
    }
  }, [router, user, userType]);

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
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] font-bold text-[#536066]">Preparing your workspace...</main>;
  }

  return (
    <AppShell>
      <section
        className="relative overflow-hidden bg-[#07111f] bg-cover bg-center p-6 text-white sm:p-8"
        style={{ backgroundImage: "url('/nata-connect-brand-poster.png')" }}
      >
        <div className="absolute inset-0 bg-[#10191d]/70" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
          <p className="text-xs font-black uppercase text-[#7fd0c7]">
            {userType === 'RECRUITER' ? 'Recruiter workspace' : 'Talent workspace'}
          </p>
          <h1 className="mt-2 text-4xl font-black">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            {userType === 'RECRUITER'
              ? 'Keep your casting pipeline moving and your briefs current.'
              : 'Track momentum, discover roles, and keep your portfolio ready.'}
          </p>
          </div>
          <Link
            href={userType === 'RECRUITER' ? '/recruiter/auditions/new' : '/auditions'}
            className="primary-button"
          >
            {userType === 'RECRUITER' ? 'Post an audition' : 'Browse auditions'}
          </Link>
        </div>
      </section>

      {error && (
        <p className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {error}
        </p>
      )}

      {!user?.emailVerified && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-[#bad7d3] bg-[#edf7f5] p-4 text-sm text-[#234b47]">
          <p><span className="font-bold">Email verification pending.</span> Open the Firebase message in your inbox to strengthen account trust.</p>
          <span className="font-bold text-[#008ca6]">{user?.email}</span>
        </div>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {(userType === 'RECRUITER' ? recruiterStats : talentStats).map(
          ([label, value], index) => (
            <article key={label} className="surface relative overflow-hidden p-6">
              <div className={`absolute inset-x-0 top-0 h-1 ${index === 0 ? 'bg-[#008ca6]' : index === 1 ? 'bg-[#d8a843]' : 'bg-[#e7ad2d]'}`} />
              <p className="text-sm font-bold text-[#657176]">{label}</p>
              <p className="mt-4 text-4xl font-black text-[#07111f]">{value}</p>
              <p className="mt-2 text-xs uppercase text-[#8a9697]">Live workspace total</p>
            </article>
          )
        )}
      </section>

      <section className="surface mt-7">
        <div className="flex items-center justify-between border-b border-[#e1e5ea] p-6">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2 className="mt-2 text-2xl font-black">
            {userType === 'RECRUITER' ? 'Recent auditions' : 'Recent applications'}
            </h2>
          </div>
          <Link
            href={userType === 'RECRUITER' ? '/recruiter/auditions' : '/applications'}
            className="text-sm font-bold text-[#008ca6]"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-[#e1e5ea]">
          {userType === 'RECRUITER'
            ? auditions.slice(0, 5).map((audition) => (
                <div key={audition.id} className="flex items-center justify-between gap-4 p-6">
                  <div><p className="font-bold">{audition.title}</p><p className="mt-1 text-sm text-[#68727c]">{audition.applicantCount} applicants in pipeline</p></div>
                  <StatusBadge status={audition.status} />
                </div>
              ))
            : applications.slice(0, 5).map((application) => (
                <div key={`${application.auditionId}-${application.id}`} className="flex items-center justify-between gap-4 p-6">
                  <div><p className="font-bold">{application.audition?.title ?? 'Audition'}</p><p className="mt-1 text-sm text-[#68727c]">{application.audition?.recruiterName ?? 'Recruiter'}</p></div>
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
