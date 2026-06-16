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
import { ErrorState, LoadingState } from '@/components/async-state';

const statusValue = (items: Application[], status: Application['status']) =>
  items.filter((item) => item.status === status).length;

export default function Dashboard() {
  const router = useRouter();
  const { user, userType, loading, error } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [firstName, setFirstName] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user || !userType) return;
    if (userType === 'TALENT') {
      void Promise.all([
        getTalentApplications(user.uid),
        getTalentProfile(user.uid),
      ]).then(([items, profile]) => {
        setApplications(items);
        setFirstName(profile?.firstName ?? '');
      }).catch((loadError: unknown) => {
        setDataError(
          loadError instanceof Error
            ? loadError.message
            : 'Your workspace data could not be loaded.'
        );
      }).finally(() => setDataLoading(false));
    } else if (userType === 'RECRUITER') {
      void Promise.all([
        getRecruiterProfile(user.uid),
        getRecruiterAuditions(user.uid),
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
      }).catch((loadError: unknown) => {
        setDataError(
          loadError instanceof Error
            ? loadError.message
            : 'Your workspace data could not be loaded.'
        );
      }).finally(() => setDataLoading(false));
    }
  }, [reloadKey, router, user, userType]);

  const talentStats = useMemo(
    () => [
      ['Applications', applications.length],
      ['Viewed', statusValue(applications, 'VIEWED')],
      ['Shortlisted', statusValue(applications, 'SHORTLISTED')],
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
        className="relative overflow-hidden rounded-md bg-[#07111f] bg-cover bg-center p-5 text-white sm:p-8"
        style={{ backgroundImage: "url('/nata-connect-brand-poster.png')" }}
      >
        <div className="absolute inset-0 bg-[#10191d]/70" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <p className="text-xs font-black uppercase text-[#7fd0c7]">
            {userType === 'RECRUITER' ? 'Recruiter workspace' : 'Talent workspace'}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
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
            className="primary-button sm:w-auto"
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

      {dataError && (
        <ErrorState
          title="Workspace data is unavailable"
          message={dataError}
          onRetry={() => {
            setDataLoading(true);
            setDataError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {dataLoading && <LoadingState label="Loading your workspace activity..." />}

      {!dataLoading && !dataError && (
      <>
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {(userType === 'RECRUITER'
          ? [
              ['Review applicants', 'Open your live casting calls and keep decisions moving.', '/recruiter/auditions'],
              ['Post a brief', 'Create a clear casting call with deadline, requirements, and role context.', '/recruiter/auditions/new'],
              ['Check messages', 'Reply to shortlisted Talent while keeping communication protected.', '/messages'],
            ]
          : [
              ['Complete profile', 'Keep your profile, media, and verification signals ready for recruiters.', '/talent/profile'],
              ['Find roles', 'Browse active auditions matched to your category, location, and experience.', '/auditions'],
              ['Track replies', 'Follow application status and open recruiter conversations quickly.', '/applications'],
            ]
        ).map(([title, body, href]) => (
          <Link key={title} href={href} className="mobile-card block rounded-md p-5 hover:border-[#008ca6]">
            <p className="eyebrow">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[#526874]">{body}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {(userType === 'RECRUITER' ? recruiterStats : talentStats).map(
          ([label, value], index) => (
            <article key={label} className="surface relative overflow-hidden p-5 sm:p-6">
              <div className={`absolute inset-x-0 top-0 h-1 ${index === 0 ? 'bg-[#008ca6]' : index === 1 ? 'bg-[#d8a843]' : 'bg-[#e7ad2d]'}`} />
              <p className="text-sm font-bold text-[#657176]">{label}</p>
              <p className="mt-3 text-3xl font-black text-[#07111f] sm:text-4xl">{value}</p>
              <p className="mt-2 text-xs uppercase text-[#8a9697]">Live workspace total</p>
            </article>
          )
        )}
      </section>

      <section className="surface mt-7">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1e5ea] p-5 sm:p-6">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2 className="mt-2 text-xl font-black sm:text-2xl">
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
                <div key={audition.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div><p className="font-bold">{audition.title}</p><p className="mt-1 text-sm text-[#68727c]">{audition.applicantCount} applicants in pipeline</p></div>
                  <StatusBadge status={audition.status} />
                </div>
              ))
            : applications.slice(0, 5).map((application) => (
                <div key={`${application.auditionId}-${application.id}`} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
      </>
      )}
    </AppShell>
  );
}
