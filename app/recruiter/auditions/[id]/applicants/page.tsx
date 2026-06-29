'use client';

import { ChevronDown, ExternalLink, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  APPLICATION_STATUS_LABELS,
  filterApplicants,
  getApplicationStatus,
  getPipelineCounts,
  sortApplicants,
  type ApplicantFilters,
  type ApplicantSort,
  type RecruiterReviewInput,
} from '@/app/lib/application-pipeline';
import { getErrorMessage } from '@/app/lib/error-utils';
import {
  getAuditionApplicants,
  getAuditionById,
  markSelfTapeReviewed,
  updateApplicationReview,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type ApplicationStatus,
  type Audition,
  type AuditionApplicant,
} from '@/app/lib/types';
import {
  getSelfTapeBadgeTone,
  getSelfTapeStatus,
  SELF_TAPE_STATUS_LABELS,
} from '@/app/lib/self-tape-policy';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { StatusBadge } from '@/components/status-badge';
import { VerifiedBadge } from '@/components/verified-badge';
import { useAuth } from '@/context/auth-context';
import { ApplicationMessageButton } from '@/components/application-message-button';
import { getConversations } from '@/app/lib/messaging-client';
import { getConversationId } from '@/app/lib/messaging-policy';
import { NextActionPanel } from '@/components/product-ui';

const initialFilters: ApplicantFilters = {
  status: 'ALL',
  verifiedOnly: false,
  hasMedia: false,
  hasShowreel: false,
  completenessAbove70: false,
  minimumRating: 0,
  search: '',
  tag: '',
  category: '',
  location: '',
  language: '',
};

const applicantStageTabs: Array<{
  label: string;
  status: ApplicationStatus | 'ALL';
}> = [
  { label: 'All', status: 'ALL' },
  { label: 'New', status: 'APPLIED' },
  { label: 'Viewed', status: 'VIEWED' },
  { label: 'Reviewing', status: 'UNDER_REVIEW' },
  { label: 'Maybe', status: 'MAYBE' },
  { label: 'Shortlisted', status: 'SHORTLISTED' },
  { label: 'Callback', status: 'CALLBACK' },
  { label: 'Final Round', status: 'FINAL_ROUND' },
  { label: 'Selected', status: 'SELECTED' },
  { label: 'Rejected', status: 'REJECTED' },
];

const quickStatuses: ApplicationStatus[] = [
  'VIEWED',
  'SHORTLISTED',
  'CALLBACK',
  'FINAL_ROUND',
  'SELECTED',
  'REJECTED',
];

export default function AuditionApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [audition, setAudition] = useState<Audition | null>(null);
  const [applicants, setApplicants] = useState<AuditionApplicant[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState<ApplicantSort>('NEWEST');
  const [expandedId, setExpandedId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getAuditionById(id),
      getAuditionApplicants(id),
      getConversations().catch(() => ({ conversations: [] })),
    ])
      .then(([auditionData, applicantData, conversationData]) => {
        if (!auditionData || auditionData.recruiterId !== user.uid) {
          router.replace('/recruiter/auditions');
          return;
        }
        setAudition(auditionData);
        setApplicants(applicantData);
        setUnreadConversationIds(
          new Set(
            conversationData.conversations
              .filter((item) => item.unreadBy.includes(user.uid))
              .map((item) => item.id)
          )
        );
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load applicants'))
      )
      .finally(() => setLoading(false));
  }, [id, reloadKey, router, user]);

  const counts = useMemo(() => getPipelineCounts(applicants), [applicants]);
  const selfTapeSubmittedCount = useMemo(
    () =>
      applicants.filter(({ application }) => {
        const status = getSelfTapeStatus(application, audition);
        return status === 'submitted' || status === 'reviewed';
      }).length,
    [applicants, audition]
  );
  const visibleApplicants = useMemo(
    () => sortApplicants(filterApplicants(applicants, filters), sort),
    [applicants, filters, sort]
  );

  const updateReview = async (
    applicant: AuditionApplicant,
    review: RecruiterReviewInput,
    rejectionReason?: string
  ) => {
    setBusyId(applicant.application.id);
    setError('');
    try {
      await updateApplicationReview(
        id,
        applicant.application.id,
        review,
        rejectionReason
      );
      const changedAt = new Date();
      setApplicants((current) =>
        current.map((item) =>
          item.application.id === applicant.application.id
            ? {
                ...item,
                application: {
                  ...item.application,
                  ...(review.status
                    ? {
                        status: review.status,
                        recruiterStatus: review.status,
                        statusUpdatedAt: changedAt,
                        statusUpdatedBy: user?.uid,
                        lastStatusChange: changedAt,
                        statusHistory: [
                          ...(item.application.statusHistory ?? []),
                          {
                            status: review.status,
                            changedBy: user?.uid ?? 'recruiter',
                            changedAt,
                          },
                        ],
                      }
                    : {}),
                  ...(review.recruiterNote !== undefined
                    ? { recruiterNote: review.recruiterNote }
                    : {}),
                  ...(review.recruiterRating !== undefined
                    ? {
                        recruiterRating:
                          review.recruiterRating ?? undefined,
                      }
                    : {}),
                  ...(review.internalTags !== undefined
                    ? { internalTags: review.internalTags }
                    : {}),
                  ...(review.status === 'REJECTED'
                    ? { rejectionReason }
                    : {}),
                  lastRecruiterActionAt: new Date(),
                },
              }
            : item
        )
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update this application'));
      throw err;
    } finally {
      setBusyId('');
    }
  };

  const reviewSelfTape = async (applicant: AuditionApplicant) => {
    setBusyId(applicant.application.id);
    setError('');
    try {
      await markSelfTapeReviewed(id, applicant.application.id);
      setApplicants((current) =>
        current.map((item) =>
          item.application.id === applicant.application.id
            ? {
                ...item,
                application: {
                  ...item.application,
                  selfTapeStatus: 'reviewed',
                  selfTapeReviewedAt: new Date(),
                  lastRecruiterActionAt: new Date(),
                },
              }
            : item
        )
      );
    } catch (reviewError: unknown) {
      setError(getErrorMessage(reviewError, 'Unable to review self-tape'));
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

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Applicant pipeline</p>
          <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
            {audition?.title ?? 'Casting workspace'}
          </h1>
          {audition && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="text-sm font-bold text-[#4a5f69]">
                {CATEGORY_LABELS[audition.category]}
              </span>
              <span className="text-[#aab5bb]" aria-hidden="true">·</span>
              <span className="text-sm font-bold text-[#4a5f69]">
                Closes {formatDate(audition.deadline)}
              </span>
              <span className="text-[#aab5bb]" aria-hidden="true">·</span>
              <StatusBadge status={audition.status} />
              {audition.selfTapeEnabled && selfTapeSubmittedCount > 0 && (
                <>
                  <span className="text-[#aab5bb]" aria-hidden="true">·</span>
                  <span className="text-sm font-bold text-[#4a5f69]">
                    {selfTapeSubmittedCount} self-tape{selfTapeSubmittedCount !== 1 ? 's' : ''} submitted
                  </span>
                </>
              )}
            </div>
          )}
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
            Compare profiles, organize your shortlist, and keep casting
            decisions in one private workspace.
          </p>
        </div>
      </header>

      <section
        aria-label="Pipeline summary"
        className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-4"
      >
        <ReviewMetric label="Total applicants" value={String(applicants.length)} />
        <ReviewMetric label="New" value={String(counts.APPLIED)} />
        <ReviewMetric label="Viewed & reviewing" value={String(counts.VIEWED + counts.UNDER_REVIEW)} />
        <ReviewMetric label="Shortlisted" value={String(counts.SHORTLISTED)} />
        <ReviewMetric label="Callback" value={String(counts.CALLBACK + counts.MAYBE)} />
        <ReviewMetric label="Final round" value={String(counts.FINAL_ROUND)} />
        <ReviewMetric label="Selected" value={String(counts.SELECTED)} />
        <ReviewMetric label="Rejected" value={String(counts.REJECTED)} />
      </section>

      <section
        aria-label="Applicant status filters"
        className="mt-6 overflow-x-auto border-b border-[#d9dee5]"
      >
        <div className="flex min-w-max">
          {applicantStageTabs.map(({ label, status }) => (
            <PipelineTab
              key={status}
              label={label}
              count={status === 'ALL' ? applicants.length : counts[status]}
              active={filters.status === status}
              onClick={() => setFilters((current) => ({ ...current, status }))}
            />
          ))}
        </div>
      </section>

      <section
        aria-label="Applicant filters and sorting"
        className="mt-5 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-sm sm:p-4"
      >
        <div className="grid gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_220px_150px] md:items-center">
          <label className="relative min-w-0">
            <span className="sr-only">Search applicants</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
            />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search name, category, skill, or location"
              className="field rounded-md !pl-11 !pr-4 text-sm placeholder:font-normal"
            />
          </label>
          <label className="relative min-w-0">
            <span className="sr-only">Sort applicants</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ApplicantSort)}
              className="field rounded-md appearance-none !pr-10 text-sm font-bold"
            >
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
              <option value="COMPLETENESS">Highest completeness</option>
              <option value="RATING">Highest rating</option>
              <option value="UPDATED">Recently updated</option>
              <option value="VERIFIED">Verified first</option>
              <option value="MEDIA">Has media first</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
            />
          </label>
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="secondary-button rounded-md text-sm sm:w-auto md:w-full"
          >
            Clear filters
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 border-t border-[#e1e5ea] pt-3">
          <FilterToggle
            label="Verified Talent"
            checked={filters.verifiedOnly}
            onChange={(checked) =>
              setFilters((current) => ({ ...current, verifiedOnly: checked }))
            }
          />
          <FilterToggle
            label="Has portfolio media"
            checked={filters.hasMedia}
            onChange={(checked) =>
              setFilters((current) => ({ ...current, hasMedia: checked }))
            }
          />
          <FilterToggle
            label="Has showreel"
            checked={filters.hasShowreel}
            onChange={(checked) =>
              setFilters((current) => ({ ...current, hasShowreel: checked }))
            }
          />
          <FilterToggle
            label="Profile 70%+"
            checked={filters.completenessAbove70}
            onChange={(checked) =>
              setFilters((current) => ({
                ...current,
                completenessAbove70: checked,
              }))
            }
          />
          <label className="flex items-center gap-2 text-sm font-bold">
            Rating
            <select
              value={filters.minimumRating}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minimumRating: Number(event.target.value),
                }))
              }
              className="min-h-9 border border-[#cbd6db] bg-white px-2"
            >
              <option value="0">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={filters.tag}
            onChange={(event) =>
              setFilters((current) => ({ ...current, tag: event.target.value }))
            }
            placeholder="Filter by internal tag"
            className="field rounded-md text-sm"
          />
          <input
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
            placeholder="Category"
            className="field rounded-md text-sm"
          />
          <input
            value={filters.location}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                location: event.target.value,
              }))
            }
            placeholder="Location"
            className="field rounded-md text-sm"
          />
          <input
            value={filters.language}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                language: event.target.value,
              }))
            }
            placeholder="Language"
            className="field rounded-md text-sm"
          />
        </div>
      </section>

      <div className="mt-5">
        <NextActionPanel
          eyebrow="Casting board"
          title="Review profile fit, move the stage, and keep notes professional."
          description="Use the pipeline tabs to focus the room: open new applicants, check self-tapes, shortlist strong profiles, message only when there is a clear next step, and close the loop when a decision is made."
          actionHref="/messages"
          actionLabel="Open casting inbox"
          secondaryHref={`/auditions/${id}`}
          secondaryLabel="View public brief"
          icon={Star}
        />
      </div>

      {error && (
        <ErrorState
          title="Applicant pipeline needs attention"
          message="We could not load this section. Try refreshing the page."
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}

      <div className="mt-6 space-y-4">
        {loading && <LoadingState label="Loading the applicant pipeline..." />}
        {!loading &&
          visibleApplicants.map((applicant) => (
            <ApplicantCard
              key={applicant.application.id}
              applicant={applicant}
              audition={audition}
              auditionId={id}
              unread={unreadConversationIds.has(
                getConversationId(id, applicant.application.id)
              )}
              expanded={expandedId === applicant.application.id}
              busy={busyId === applicant.application.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === applicant.application.id
                    ? ''
                    : applicant.application.id
                )
              }
              onUpdate={(review, reason) =>
                updateReview(applicant, review, reason)
              }
              onSelfTapeReviewed={() => reviewSelfTape(applicant)}
            />
          ))}
        {!loading && !error && visibleApplicants.length === 0 && (
          <EmptyState
            title="No applicants match these filters"
            message="If this brief is new, share the public link only in appropriate channels and keep applications inside Nata Connect. If filters are active, clear them or choose All."
            actionHref={`/auditions/${id}`}
            actionLabel="View public brief"
          />
        )}
      </div>
    </AppShell>
  );
}

function PipelineTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 border-b-2 px-4 text-sm font-bold ${
        active
          ? 'border-[#008ca6] text-[#008ca6]'
          : 'border-transparent text-[#657176]'
      }`}
    >
      {label} <span className="ml-1 text-xs">({count})</span>
    </button>
  );
}

function TalentChip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'score' | 'media';
}) {
  const classes =
    tone === 'score'
      ? 'border-[#9fc9c4] bg-[#edf7f5] text-[#006b60]'
      : tone === 'media'
        ? 'border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]'
        : 'border-[#d5dee3] bg-[#f4f6f8] text-[#4e5e66]';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classes}`}>
      {children}
    </span>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d7e0e4] bg-white p-3">
      <p className="text-base font-black capitalize text-[#07111f] leading-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-[#657176]">
        {label}
      </p>
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 text-sm font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#008ca6]"
      />
      {label}
    </label>
  );
}

function ApplicantCard({
  applicant,
  audition,
  auditionId,
  unread,
  expanded,
  busy,
  onToggle,
  onUpdate,
  onSelfTapeReviewed,
}: {
  applicant: AuditionApplicant;
  audition: Audition | null;
  auditionId: string;
  unread: boolean;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onUpdate: (
    review: RecruiterReviewInput,
    rejectionReason?: string
  ) => Promise<void>;
  onSelfTapeReviewed: () => Promise<void>;
}) {
  const { application, talent, media } = applicant;
  const status = getApplicationStatus(application);
  const selfTapeStatus = getSelfTapeStatus(application, audition);
  const selfTapeRequired = audition?.selfTapeRequired === true;
  const selfTapeAvailable = Boolean(application.selfTapeSubmission?.url);
  const showSelfTape =
    audition?.selfTapeEnabled === true || selfTapeStatus !== 'not_requested';
  const name = talent
    ? `${talent.firstName} ${talent.lastName}`.trim()
    : application.talentEmail ?? 'Talent profile unavailable';
  const featuredMedia = media.find((item) => item.isFeatured) ?? media[0];
  const [note, setNote] = useState(
    application.recruiterNote ?? application.recruiterNotes ?? ''
  );
  const [tags, setTags] = useState((application.internalTags ?? []).join(', '));
  const [rating, setRating] = useState(application.recruiterRating ?? 0);

  const changeStatus = async (nextStatus: ApplicationStatus) => {
    const rejectionReason =
      nextStatus === 'REJECTED'
        ? window.prompt('Optional feedback visible to the Talent member.') ??
          undefined
        : undefined;
    await onUpdate({ status: nextStatus }, rejectionReason);
  };

  return (
    <article className="surface overflow-hidden rounded-md">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              role="img"
              aria-label={`${name} profile photo`}
              className="size-16 shrink-0 rounded-md border border-[#cbd6db] bg-[#e7eef1] bg-cover bg-center sm:size-20"
              style={
                talent?.profilePhotoUrl
                  ? { backgroundImage: `url("${talent.profilePhotoUrl}")` }
                  : undefined
              }
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black leading-tight sm:text-2xl">{name}</h2>
                {talent?.talentVerificationStatus === 'verified' && (
                  <VerifiedBadge subject="talent" />
                )}
              </div>
              <p className="mt-1 text-sm text-[#657176]">
                Applied {formatDate(application.createdAt)}
                {application.lastRecruiterActionAt &&
                  ` · Last action ${formatDate(application.lastRecruiterActionAt)}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <TalentChip>
                  {talent ? CATEGORY_LABELS[talent.category] : 'Category unavailable'}
                </TalentChip>
                {talent?.experienceLevel && (
                  <TalentChip>{EXPERIENCE_LABELS[talent.experienceLevel]}</TalentChip>
                )}
                <TalentChip>{talent?.location || 'Location unavailable'}</TalentChip>
                <TalentChip tone="score">
                  {talent?.profileCompletenessScore ?? 0}% complete
                </TalentChip>
                {(talent?.languages ?? []).slice(0, 2).map((language) => (
                  <TalentChip key={language}>{language}</TalentChip>
                ))}
                {(talent?.skills ?? []).slice(0, 2).map((skill) => (
                  <TalentChip key={skill}>{skill}</TalentChip>
                ))}
                {media.length > 0 && (
                  <TalentChip tone="media">{media.length} media</TalentChip>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span
              className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-black uppercase ${selfTapeToneClass(
                getSelfTapeBadgeTone(selfTapeStatus)
              )}`}
            >
              {getRecruiterSelfTapeLabel(selfTapeStatus, selfTapeRequired)}
            </span>
            <StatusBadge status={status} />
            {selfTapeAvailable && (
              <a
                href={application.selfTapeSubmission?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button sm:w-auto"
              >
                Open self-tape
              </a>
            )}
            {talent?.publicSlug && (
              <Link
                href={`/t/${talent.publicSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button sm:w-auto"
              >
                Portfolio
              </Link>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="secondary-button sm:w-auto"
              aria-expanded={expanded}
            >
              {expanded ? 'Close review' : 'Review profile'}
            </button>
          </div>
        </div>

        {application.coverMessage && (
          <div className="mt-5 rounded-md border border-[#d9e4e6] bg-[#f7fbfb] p-3">
            <p className="text-xs font-black uppercase text-[#008ca6]">
              Application note
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#4f5963]">
              {application.coverMessage}
            </p>
          </div>
        )}

        {status === 'WITHDRAWN' ? (
          <p className="mt-5 border-l-2 border-[#9aa4aa] pl-4 text-sm text-[#657176]">
            This application was withdrawn by the Talent member and is read-only.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#e1e5ea] pt-5 sm:flex sm:flex-wrap">
            {quickStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                disabled={busy || status === nextStatus}
                onClick={() => void changeStatus(nextStatus)}
                className={`min-h-11 rounded-md border px-3 text-xs font-bold disabled:opacity-40 ${
                  nextStatus === 'SELECTED'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : nextStatus === 'REJECTED'
                      ? 'border-red-300 text-red-700'
                      : 'border-[#cbd6db] bg-white text-[#263238]'
                }`}
              >
                {APPLICATION_STATUS_LABELS[nextStatus]}
              </button>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#d7e0e4] bg-[#f6f9fa] p-4 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
            <div className="space-y-6">
              <ReviewSection title="Application message">
                <p className="leading-7 text-[#4f5963]">
                  {application.coverMessage || 'No cover message was provided.'}
                </p>
              </ReviewSection>

              <ReviewSection title="Status timeline">
                <StatusTimeline application={application} />
              </ReviewSection>

              {showSelfTape && (
                <ReviewSection title="Self-tape submission">
                  <div className="rounded-md border border-[#bad7d3] bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#657176]">
                          {audition?.selfTapeRequired
                            ? 'Required for this role'
                            : 'Optional for this role'}
                        </p>
                        <p className="mt-2 whitespace-pre-line leading-7 text-[#4f5963]">
                          {audition?.selfTapeInstructions ||
                            'No extra self-tape instructions were provided.'}
                        </p>
                        {audition?.selfTapeMaxDurationSeconds && (
                          <p className="mt-2 text-xs font-black uppercase text-[#657176]">
                            Max duration: {audition.selfTapeMaxDurationSeconds}{' '}
                            seconds
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex min-h-8 shrink-0 items-center rounded-md border px-3 text-xs font-black uppercase ${selfTapeToneClass(
                          getSelfTapeBadgeTone(selfTapeStatus)
                        )}`}
                      >
                        {SELF_TAPE_STATUS_LABELS[selfTapeStatus]}
                      </span>
                    </div>

                    {application.selfTapeSubmission?.url ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <a
                          href={application.selfTapeSubmission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#008ca6] px-4 text-sm font-black text-[#008ca6]"
                        >
                          Open self-tape
                          <ExternalLink className="size-4" />
                        </a>
                        {selfTapeStatus === 'submitted' && (
                          <button
                            type="button"
                            onClick={() => void onSelfTapeReviewed()}
                            disabled={busy}
                            className="primary-button sm:w-auto disabled:opacity-50"
                          >
                            {busy ? 'Saving...' : 'Mark reviewed'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 border-l-2 border-[#e7ad2d] pl-4 text-sm leading-6 text-[#657176]">
                        No self-tape link has been submitted for this application
                        yet.
                      </p>
                    )}
                  </div>
                </ReviewSection>
              )}

              {talent && (
                <ReviewSection title="Talent profile">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ApplicantDetail
                      label="Experience"
                      value={EXPERIENCE_LABELS[talent.experienceLevel]}
                    />
                    <ApplicantDetail
                      label="Verification"
                      value={
                        talent.talentVerificationStatus?.replace(/_/g, ' ') ??
                        'Not submitted'
                      }
                    />
                    <ApplicantDetail
                      label="Completeness"
                      value={`${talent.profileCompletenessScore ?? 0}%`}
                    />
                  </div>
                  {talent.bio && (
                    <p className="mt-5 leading-7 text-[#4f5963]">{talent.bio}</p>
                  )}
                  {(talent.skills?.length || talent.languages?.length) && (
                    <div className="mt-4 space-y-2">
                      {(talent.skills?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="mr-1 text-[10px] font-black uppercase tracking-wide text-[#7b8a90]">Skills</span>
                          {(talent.skills ?? []).map((item) => (
                            <span key={item} className="rounded-md border border-[#cbd6db] bg-white px-2.5 py-1 text-xs font-bold">{item}</span>
                          ))}
                        </div>
                      )}
                      {(talent.languages?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="mr-1 text-[10px] font-black uppercase tracking-wide text-[#7b8a90]">Languages</span>
                          {(talent.languages ?? []).map((item) => (
                            <span key={item} className="rounded-md border border-[#9fc9c4] bg-[#edf7f5] px-2.5 py-1 text-xs font-bold text-[#006b60]">{item}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {talent.publicSlug && (
                    <Link
                      href={`/t/${talent.publicSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex text-sm font-black text-[#008ca6] hover:underline"
                    >
                      View public portfolio →
                    </Link>
                  )}
                </ReviewSection>
              )}

              {media.length > 0 && (
                <ReviewSection title="Portfolio preview">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {media.map((item) => (
                      <article
                        key={item.id}
                        className={`border bg-white p-3 ${
                          item.id === featuredMedia?.id
                            ? 'border-[#d8a843]'
                            : 'border-[#dce3e7]'
                        }`}
                      >
                        {item.type === 'image' && item.url ? (
                          <div
                            role="img"
                            aria-label={item.title}
                            className="aspect-video bg-[#e7eef1] bg-cover bg-center"
                            style={{ backgroundImage: `url("${item.url}")` }}
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-[#07111f] px-4 text-center text-sm font-bold text-white">
                            Showreel link
                          </div>
                        )}
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">{item.title}</p>
                            {item.isFeatured && (
                              <p className="mt-1 text-xs font-bold text-[#a56b00]">
                                Featured
                              </p>
                            )}
                          </div>
                          {item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${item.title}`}
                              className="text-[#008ca6]"
                            >
                              <ExternalLink className="size-5" />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </ReviewSection>
              )}
            </div>

            <aside className="rounded-md border border-[#d7e0e4] bg-white p-4 sm:p-5">
              <h3 className="text-lg font-black">Private casting notes</h3>
              <p className="mt-1 text-sm leading-6 text-[#657176]">
                Notes, tags, and ratings are visible only to the audition owner
                and authorized administrators.
              </p>

              <fieldset className="mt-5">
                <legend className="text-sm font-bold">Rating</legend>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Rate ${value} star${value === 1 ? '' : 's'}`}
                      onClick={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        className={`size-6 ${
                          value <= rating
                            ? 'fill-[#d8a843] text-[#d8a843]'
                            : 'text-[#aab3b8]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block text-sm font-bold">
                Recruiter note
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  rows={6}
                  className="mt-2 w-full border border-[#cbd6db] p-3 font-normal"
                  placeholder="Performance observations, callback questions, or team notes"
                />
              </label>

              <label className="mt-4 block text-sm font-bold">
                Internal tags
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="mt-2 min-h-11 w-full border border-[#cbd6db] px-3 font-normal"
                  placeholder="strong dialogue, callback, local"
                />
              </label>

              <button
                type="button"
                disabled={busy || status === 'WITHDRAWN'}
                onClick={() =>
                  void onUpdate({
                    recruiterNote: note,
                    recruiterRating: rating || null,
                    internalTags: tags
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                className="primary-button mt-5 w-full disabled:opacity-50"
              >
                {busy ? 'Saving review...' : 'Save private review'}
              </button>

              {status !== 'WITHDRAWN' && (
                <div className="mt-4 rounded-md border border-[#d7e0e4] bg-[#f6f9fa] p-3 text-sm">
                  <p className="font-black text-[#263238]">Next action</p>
                  <p className="mt-1 leading-6 text-[#4f5963]">
                    {getNextRecruiterAction(status)}
                  </p>
                </div>
              )}

              <ApplicationMessageButton
                auditionId={auditionId}
                applicationId={application.id}
                label={
                  status === 'WITHDRAWN'
                    ? 'Conversation unavailable'
                    : unread
                      ? 'Message Talent (new)'
                      : 'Message Talent'
                }
                disabled={status === 'WITHDRAWN'}
                className="mt-3 w-full"
              />
            </aside>
          </div>
        </div>
      )}
    </article>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ApplicantDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#778287]">{label}</p>
      <p className="mt-1 font-bold capitalize">{value}</p>
    </div>
  );
}

function StatusTimeline({ application }: { application: AuditionApplicant['application'] }) {
  const currentStatus = getApplicationStatus(application);
  const history = application.statusHistory?.length
    ? application.statusHistory
    : [
        {
          status: application.status,
          changedBy: application.statusUpdatedBy ?? application.talentId,
          changedAt:
            application.statusUpdatedAt ??
            application.lastStatusChange ??
            application.createdAt,
        },
      ];

  return (
    <ol className="space-y-3">
      {history.map((item, index) => (
        <li
          key={`${item.status}-${index}`}
          className="rounded-md border border-[#dce3e7] bg-white p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <StatusBadge status={item.status} />
            <span className="text-xs font-bold text-[#657176]">
              {item.changedAt ? formatDate(item.changedAt) : 'Date unavailable'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#4f5963]">
            {getRecruiterTimelineCopy(item.status, currentStatus)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function getNextRecruiterAction(status: ApplicationStatus): string {
  const actions: Record<ApplicationStatus, string> = {
    APPLIED: 'Open this profile and log your first look by moving to Viewed.',
    VIEWED: 'Review the profile and materials. Move to Shortlisted, Reviewing, or Rejected.',
    UNDER_REVIEW: 'Compare with your shortlist. Move to Shortlisted, Maybe, or Rejected.',
    MAYBE: 'Make a final call — Shortlist, Callback, or Reject this application.',
    SHORTLISTED: 'Confirm your shortlist. Move to Callback or message to discuss next steps.',
    CALLBACK: 'Discuss next steps via messages. Move to Final Round when ready.',
    FINAL_ROUND: 'Make the casting decision — Select or Reject.',
    SELECTED: 'Send a message to share next steps with the Talent member.',
    REJECTED: 'Application closed. No further action required.',
    WITHDRAWN: '',
  };
  return actions[status] ?? '';
}

function getRecruiterTimelineCopy(
  status: ApplicationStatus,
  currentStatus: ApplicationStatus
) {
  const descriptions: Record<ApplicationStatus, string> = {
    APPLIED: 'Profile received — application in the recruiter inbox.',
    VIEWED: 'Profile opened by the casting team.',
    UNDER_REVIEW: 'Actively under recruiter review.',
    MAYBE: 'Held in the consideration pool before a final decision.',
    SHORTLISTED: 'Added to the shortlist for this role.',
    CALLBACK: 'Callback stage — follow up through messages if needed.',
    FINAL_ROUND: 'In the final casting round.',
    SELECTED: 'Selected for the role.',
    REJECTED: 'Application not taken forward.',
    WITHDRAWN: 'Withdrawn by the Talent member.',
  };
  const description = descriptions[status] ?? 'Stage recorded.';
  return status === currentStatus ? `Current — ${description}` : description;
}

function getRecruiterSelfTapeLabel(
  status: ReturnType<typeof getSelfTapeStatus>,
  required: boolean
) {
  if (status === 'not_requested') return 'No self-tape required';
  if (status === 'missing' && required) return 'Self-tape required';
  if (status === 'requested') return 'Self-tape optional';
  if (status === 'submitted') return 'Self-tape submitted';
  if (status === 'reviewed') return 'Self-tape reviewed';
  return SELF_TAPE_STATUS_LABELS[status];
}

function selfTapeToneClass(tone: string) {
  return tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'attention'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-[#d3dde2] bg-white text-[#657176]';
}
