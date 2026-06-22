'use client';

import Link from 'next/link';
import { BriefcaseBusiness, ClipboardList, FilePenLine, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { getRecruiterAuditions } from '@/app/lib/firestore-service';
import { formatDate, type Audition } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { MetricCard, SafetyNotice, WorkspaceHero } from '@/components/product-ui';

export default function RecruiterAuditionsPage() {
  const { user } = useAuth();
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    void getRecruiterAuditions(user.uid)
      .then(setAuditions)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load your auditions'))
      )
      .finally(() => setLoading(false));
  }, [reloadKey, user]);

  const stats = useMemo(
    () => ({
      active: auditions.filter((item) => item.status === 'ACTIVE').length,
      applicants: auditions.reduce(
        (total, item) => total + (item.applicantCount ?? 0),
        0
      ),
      selfTape: auditions.filter((item) => item.selfTapeEnabled).length,
      drafts: auditions.filter((item) => item.status === 'DRAFT').length,
    }),
    [auditions]
  );

  return (
    <AppShell requiredRole="RECRUITER">
      <WorkspaceHero
        eyebrow="Casting command center"
        title="Manage auditions and keep applicant decisions moving."
        description="Track active briefs, applicant flow, self-tape requests, drafts, and the next review action from one recruiter workspace."
        actionHref="/recruiter/auditions/new"
        actionLabel="Post audition"
        secondaryHref="/messages"
        secondaryLabel="Open messages"
      />
      {error && (
        <ErrorState
          title="Your casting calls could not be loaded"
          message="We could not load this section. Try refreshing the page."
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {!loading && !error && auditions.length > 0 && (
        <section
          aria-label="Casting pipeline summary"
          className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Active calls"
            value={stats.active}
            detail="Published and visible"
            icon={BriefcaseBusiness}
          />
          <MetricCard
            label="Total applicants"
            value={stats.applicants}
            detail="Across your auditions"
            icon={ClipboardList}
            tone={stats.applicants > 0 ? 'attention' : 'neutral'}
          />
          <MetricCard
            label="Self-tape briefs"
            value={stats.selfTape}
            detail="Roles requesting media links"
            icon={Video}
          />
          <MetricCard
            label="Drafts"
            value={stats.drafts}
            detail="Not visible to Talent"
            icon={FilePenLine}
          />
        </section>
      )}
      <div className="mt-5">
        <SafetyNotice title="Casting safety standard">
          Keep all audition-related communication professional and never ask
          Talent to pay to audition.
        </SafetyNotice>
      </div>
      {loading ? (
        <LoadingState label="Loading your casting pipeline..." />
      ) : error ? null : auditions.length === 0 ? (
        <EmptyState
          title="No auditions posted yet"
          message="Create a clear casting brief when your recruiter verification is approved."
          actionHref="/recruiter/auditions/new"
          actionLabel="Post an audition"
        />
      ) : (
      <>
      <div className="mt-6 grid gap-4 lg:hidden">
        {auditions.map((audition) => (
          <article key={audition.id} className="surface rounded-md p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  Casting call
                </p>
                <h2 className="mt-1 text-lg font-black leading-snug">
                  {audition.title}
                </h2>
              </div>
              <StatusBadge status={audition.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-[#f2f6f8] p-3">
                <p className="text-xs font-bold uppercase text-[#657176]">
                  Deadline
                </p>
                <p className="mt-1 font-black">{formatDate(audition.deadline)}</p>
              </div>
              <div className="rounded-md bg-[#edf7f5] p-3">
                <p className="text-xs font-bold uppercase text-[#657176]">
                  Applicants
                </p>
                <p className="mt-1 font-black text-[#008ca6]">
                  {audition.applicantCount ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={`/recruiter/auditions/${audition.id}/applicants`}
                className="primary-button"
              >
                Review applicants
              </Link>
              <Link
                href={`/auditions/${audition.id}`}
                className="secondary-button"
              >
                View brief
              </Link>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#657176]">
              Next action: open applicants to shortlist, message, select, or
              close the pipeline.
            </p>
          </article>
        ))}
      </div>
      <div className="mt-6 hidden overflow-x-auto border border-[#d9dee5] bg-white lg:block">
        <table className="w-full text-left">
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
                <td className="p-4">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/recruiter/auditions/${audition.id}/applicants`}
                      className="text-sm font-black text-[#008ca6]"
                    >
                      Review applicants
                    </Link>
                    <Link
                      href={`/auditions/${audition.id}`}
                      className="text-sm font-semibold text-[#1f5f91]"
                    >
                      View brief
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </AppShell>
  );
}
