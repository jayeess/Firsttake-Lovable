'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  getAuditionApplicants,
  getAuditionById,
  updateApplicationStatus,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type ApplicationStatus,
  type Audition,
  type AuditionApplicant,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { VerifiedBadge } from '@/components/verified-badge';

const filters: Array<'ALL' | ApplicationStatus> = [
  'ALL',
  'APPLIED',
  'VIEWED',
  'SHORTLISTED',
  'REJECTED',
];

export default function AuditionApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [audition, setAudition] = useState<Audition | null>(null);
  const [applicants, setApplicants] = useState<AuditionApplicant[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('ALL');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;

    void Promise.all([getAuditionById(id), getAuditionApplicants(id)])
      .then(([auditionData, applicantData]) => {
        if (!auditionData || auditionData.recruiterId !== user.uid) {
          router.replace('/recruiter/auditions');
          return;
        }
        setAudition(auditionData);
        setApplicants(applicantData);
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load applicants'))
      )
      .finally(() => setLoading(false));
  }, [id, reloadKey, router, user]);

  const visibleApplicants = useMemo(
    () =>
      filter === 'ALL'
        ? applicants
        : applicants.filter(({ application }) => application.status === filter),
    [applicants, filter]
  );

  const setStatus = async (
    applicant: AuditionApplicant,
    status: ApplicationStatus
  ) => {
    setBusyId(applicant.application.id);
    setError('');

    try {
      const rejectionReason =
        status === 'REJECTED'
          ? window.prompt(
              'Optional: add a short reason the talent can understand.'
            ) ?? undefined
          : undefined;

      await updateApplicationStatus(
        id,
        applicant.application.id,
        status,
        undefined,
        rejectionReason
      );

      setApplicants((current) =>
        current.map((item) =>
          item.application.id === applicant.application.id
            ? {
                ...item,
                application: {
                  ...item.application,
                  status,
                  rejectionReason,
                },
              }
            : item
        )
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update this application'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <AppShell requiredRole="RECRUITER">
      <Link
        href="/recruiter/auditions"
        className="text-sm font-bold text-[#008ca6]"
      >
        Back to casting calls
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Applicant pipeline</p>
          <h1 className="mt-2 text-4xl font-black">
            {audition?.title ?? 'Loading casting call...'}
          </h1>
          <p className="mt-3 text-[#657176]">
            Review talent profiles, record progress, and keep every decision
            visible.
          </p>
        </div>
        <p className="border-l-2 border-[#d8a843] pl-4 text-sm font-bold">
          {applicants.length} total applicants
        </p>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto border-b border-[#d9dee5]">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-bold ${
              filter === status
                ? 'border-[#008ca6] text-[#008ca6]'
                : 'border-transparent text-[#657176]'
            }`}
          >
            {status === 'ALL' ? 'All' : status.toLowerCase()}
          </button>
        ))}
      </div>

      {error && (
        <ErrorState
          title="Applicants could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}

      <div className="mt-6 space-y-4">
        {loading && <LoadingState label="Loading the applicant pipeline..." />}
        {visibleApplicants.map((applicant) => {
          const { application, talent } = applicant;
          const name = talent
            ? `${talent.firstName} ${talent.lastName}`.trim()
            : 'Talent profile unavailable';

          return (
            <article key={application.id} className="surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-2xl font-black">{name}</p>
                    {talent?.talentVerificationStatus === 'verified' && (
                      <VerifiedBadge subject="talent" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#657176]">
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>

              {talent && (
                <div className="mt-5 grid gap-4 border-y border-[#e1e5ea] py-5 sm:grid-cols-3">
                  <ApplicantDetail
                    label="Category"
                    value={CATEGORY_LABELS[talent.category]}
                  />
                  <ApplicantDetail
                    label="Experience"
                    value={EXPERIENCE_LABELS[talent.experienceLevel]}
                  />
                  <ApplicantDetail
                    label="Location"
                    value={talent.location || 'Not provided'}
                  />
                </div>
              )}

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-bold uppercase text-[#778287]">
                    Cover message
                  </p>
                  <p className="mt-2 leading-7 text-[#4f5963]">
                    {application.coverMessage ||
                      'No cover message was provided.'}
                  </p>
                  {application.talentEmail && (
                    <>
                      <p className="mt-5 text-xs font-bold uppercase text-[#778287]">
                        Contact
                      </p>
                      <a
                        href={`mailto:${application.talentEmail}`}
                        className="mt-2 inline-block font-bold text-[#008ca6]"
                      >
                        {application.talentEmail}
                      </a>
                    </>
                  )}
                  {talent?.bio && (
                    <>
                      <p className="mt-5 text-xs font-bold uppercase text-[#778287]">
                        Profile summary
                      </p>
                      <p className="mt-2 leading-7 text-[#4f5963]">
                        {talent.bio}
                      </p>
                    </>
                  )}
                  {talent &&
                    (talent.instagramUrl ||
                      talent.youtubeUrl ||
                      talent.websiteUrl) && (
                      <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-[#008ca6]">
                        {talent.instagramUrl && (
                          <a href={talent.instagramUrl} target="_blank" rel="noreferrer">
                            Instagram
                          </a>
                        )}
                        {talent.youtubeUrl && (
                          <a href={talent.youtubeUrl} target="_blank" rel="noreferrer">
                            YouTube
                          </a>
                        )}
                        {talent.websiteUrl && (
                          <a href={talent.websiteUrl} target="_blank" rel="noreferrer">
                            Portfolio
                          </a>
                        )}
                      </div>
                    )}
                </div>

                <div className="flex min-w-48 flex-col gap-2">
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => void setStatus(applicant, 'VIEWED')}
                    className="secondary-button w-full disabled:opacity-50"
                  >
                    Mark viewed
                  </button>
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => void setStatus(applicant, 'SHORTLISTED')}
                    className="primary-button w-full disabled:opacity-50"
                  >
                    Shortlist talent
                  </button>
                  <button
                    type="button"
                    disabled={busyId === application.id}
                    onClick={() => void setStatus(applicant, 'REJECTED')}
                    className="min-h-11 border border-red-300 px-4 text-sm font-bold text-red-700 disabled:opacity-50"
                  >
                    Reject application
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!loading && !error && visibleApplicants.length === 0 && (
          <EmptyState
            title="No applicants in this stage"
            message="New applications will appear here as soon as talent submits them."
          />
        )}
      </div>
    </AppShell>
  );
}

function ApplicantDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#778287]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
