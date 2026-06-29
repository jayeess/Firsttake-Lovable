'use client';

import Link from 'next/link';
import { BriefcaseBusiness, ClipboardList, FilePenLine, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { getRecruiterAuditions } from '@/app/lib/firestore-service';
import { formatDate, type Audition } from '@/app/lib/types';
import { getCastingBriefQuality } from '@/app/lib/casting-brief-quality-policy';
import { getRecruiterTrustPassport } from '@/app/lib/recruiter-trust-passport-policy';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  CinematicSectionHeader,
  MetricCard,
  NextActionPanel,
  SafetyNotice,
  WorkspaceHero,
} from '@/components/product-ui';

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
      needsReview: auditions.filter(
        (item) => getCastingBriefQuality(item).band === 'needs_review'
      ).length,
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
        actionLabel="Post a casting brief"
        secondaryHref="/messages"
        secondaryLabel="Open messages"
      />
      <div className="mt-5">
        <NextActionPanel
          eyebrow="Casting room"
          title="Keep every brief moving toward a clear decision."
          description="Publish complete casting briefs, review applicants regularly, move strong profiles into the right stage, and keep all communication tied to the audition."
          actionHref="/recruiter/auditions/new"
          actionLabel="Create casting brief"
          secondaryHref="/messages"
          secondaryLabel="Open casting inbox"
          icon={BriefcaseBusiness}
        />
      </div>
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
            label="Needs review"
            value={stats.needsReview}
            detail="Quality or safety cues"
            icon={FilePenLine}
            tone={stats.needsReview > 0 ? 'attention' : 'neutral'}
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
          title="No casting briefs yet"
          message="Start with one complete brief: role, project type, location, timeline, language, compensation, and self-tape expectations. Clear briefs help Talent decide whether to apply."
          actionHref="/recruiter/auditions/new"
          actionLabel="Post a casting brief"
        />
      ) : (
      <>
      <div className="mt-6">
        <CinematicSectionHeader
          eyebrow="Live casting pipeline"
          title="Open applicants, shortlist, callback, or close the loop."
          description="Each row is a production decision point. Keep notes professional and only move applicants when the status reflects the real casting stage."
        />
      </div>
      <div className="mt-6 grid gap-4 lg:hidden">
        {auditions.map((audition) => (
          <article key={audition.id} className="surface rounded-md p-4">
            {(() => {
              const quality = getCastingBriefQuality(audition);
              const trustPassport = getRecruiterTrustPassport(null, audition, {
                briefQuality: quality,
              });
              return (
                <>
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BriefQualityPill
                label={quality.bandLabel}
                band={quality.band}
              />
              <SourceTransparencyPill
                label={trustPassport.bandLabel}
                band={trustPassport.band}
              />
              {quality.missingItems.length > 0 && (
                <span className="text-xs font-bold text-[#657176]">
                  {quality.missingItems.length} item
                  {quality.missingItems.length === 1 ? '' : 's'} to review
                </span>
              )}
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
            <p className="mt-3 text-xs font-bold text-[#657176]">
              Next action:{' '}
              {quality.band === 'needs_review' || quality.band === 'needs_detail'
                ? quality.missingItems[0]?.detail ?? 'Improve the brief details.'
                : 'Open applicants to shortlist, message, select, or close the pipeline.'}
            </p>
                </>
              );
            })()}
          </article>
        ))}
      </div>
      <div className="mt-6 hidden space-y-3 lg:block">
        {auditions.map((audition) => (
          (() => {
            const quality = getCastingBriefQuality(audition);
            const trustPassport = getRecruiterTrustPassport(null, audition, {
              briefQuality: quality,
            });
            return (
          <article
            key={audition.id}
            className="group flex items-center justify-between gap-5 rounded-md border border-[#d3dde2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008ca6] hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={audition.status} />
                {audition.selfTapeEnabled && (
                  <span className="rounded-md border border-[#e0c364] bg-[#fdf9eb] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#7a5500]">
                    Self-tape
                  </span>
                )}
                <BriefQualityPill
                  label={quality.bandLabel}
                  band={quality.band}
                />
                <SourceTransparencyPill
                  label={trustPassport.bandLabel}
                  band={trustPassport.band}
                />
              </div>
              <h2 className="mt-2 text-base font-black leading-snug group-hover:text-[#008ca6]">
                {audition.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-[#69727c]">
                <span>Closes {formatDate(audition.deadline)}</span>
                <span className="text-[#aab5bb]">·</span>
                <Link
                  href={`/recruiter/auditions/${audition.id}/applicants`}
                  className="font-black text-[#008ca6] hover:underline"
                >
                  {audition.applicantCount ?? 0}{' '}
                  {audition.applicantCount === 1 ? 'applicant' : 'applicants'}
                </Link>
                {quality.missingItems.length > 0 && (
                  <>
                    <span className="text-[#aab5bb]">Â·</span>
                    <span>
                      {quality.missingItems.length} readiness item
                      {quality.missingItems.length === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/auditions/${audition.id}`}
                className="secondary-button min-h-10 py-2 text-sm sm:w-auto"
              >
                View brief
              </Link>
              <Link
                href={`/recruiter/auditions/${audition.id}/applicants`}
                className="primary-button min-h-10 py-2 text-sm sm:w-auto"
              >
                Review applicants
              </Link>
            </div>
          </article>
            );
          })()
        ))}
      </div>
      </>
      )}
    </AppShell>
  );
}

function SourceTransparencyPill({
  label,
  band,
}: {
  label: string;
  band: ReturnType<typeof getRecruiterTrustPassport>['band'];
}) {
  const classes =
    band === 'verified_source' || band === 'clear_source'
      ? 'border-[#bad7d3] bg-[#edf7f5] text-[#006b60]'
      : band === 'needs_source_detail'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-800';

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}

function BriefQualityPill({
  label,
  band,
}: {
  label: string;
  band: ReturnType<typeof getCastingBriefQuality>['band'];
}) {
  const classes =
    band === 'strong_brief'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : band === 'good_brief'
        ? 'border-[#bad7d3] bg-[#edf7f5] text-[#006b60]'
        : band === 'needs_detail'
          ? 'border-amber-200 bg-amber-50 text-amber-900'
          : 'border-red-200 bg-red-50 text-red-800';

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}
