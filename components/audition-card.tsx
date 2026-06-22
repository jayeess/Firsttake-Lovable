import { Bookmark, MapPin, Video } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type Audition,
} from '@/app/lib/types';
import { StatusBadge } from './status-badge';
import { VerifiedBadge } from './verified-badge';

export function AuditionCard({
  audition,
  saved = false,
  saving = false,
  applied = false,
  recommendationScore,
  onToggleSaved,
}: {
  audition: Audition;
  saved?: boolean;
  saving?: boolean;
  applied?: boolean;
  recommendationScore?: number;
  onToggleSaved?: () => void;
}) {
  const deadlineSoon = isDeadlineSoon(audition.deadline);
  const postedRecently = isPostedRecently(audition.createdAt);
  const compensationLabel = getCompensationLabel(audition);

  return (
    <article className="group relative overflow-hidden rounded-md border border-[#cbd6db] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#008ca6] hover:shadow-md">
      {/* cinematic left-border accent — teal on hover, gold when applied */}
      <div
        className={`absolute inset-y-0 left-0 w-0.5 transition-colors ${
          applied
            ? 'bg-[#e7ad2d]'
            : 'bg-transparent group-hover:bg-[#008ca6]'
        }`}
      />

      <div className="p-4 sm:p-5">
        {/* Header: recruiter + status + save */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-[#008ca6]">
              {audition.recruiterName ?? 'Recruiter'}
              {audition.recruiterVerified && <VerifiedBadge />}
            </p>
            <h2 className="mt-1.5 text-base font-black leading-snug sm:text-lg">
              {audition.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {recommendationScore !== undefined && recommendationScore > 0 && (
              <span className="rounded-md border border-[#e0c364] bg-[#fdf9eb] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#7a5500]">
                {recommendationScore}% match
              </span>
            )}
            {applied && (
              <span className="rounded-md border border-[#9fc9c4] bg-[#edf7f5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#006b60]">
                Applied
              </span>
            )}
            <StatusBadge status={audition.status} />
            {onToggleSaved && (
              <button
                type="button"
                onClick={onToggleSaved}
                disabled={saving}
                aria-label={saved ? 'Remove saved audition' : 'Save audition'}
                title={saved ? 'Remove saved audition' : 'Save audition'}
                className="flex size-9 items-center justify-center rounded-md border border-[#cbd6db] bg-white transition hover:border-[#008ca6] disabled:opacity-50"
              >
                <Bookmark
                  className={`size-4 ${
                    saved ? 'fill-[#008ca6] text-[#008ca6]' : 'text-[#526168]'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Metadata chips */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black uppercase tracking-wide">
          {audition.recruiterVerified && (
            <Chip variant="trust">Verified recruiter</Chip>
          )}
          {postedRecently && <Chip variant="new">New</Chip>}
          {deadlineSoon && <Chip variant="urgent">Deadline soon</Chip>}
          <Chip variant="category">{CATEGORY_LABELS[audition.category]}</Chip>
          <Chip variant="neutral">{EXPERIENCE_LABELS[audition.experienceLevel]}</Chip>
          {audition.location && (
            <Chip variant="neutral">
              <MapPin className="inline size-2.5 shrink-0" />
              {audition.location}
            </Chip>
          )}
          {audition.workMode && (
            <Chip variant="neutral">{WORK_MODE_LABELS[audition.workMode]}</Chip>
          )}
          {compensationLabel && (
            <Chip variant="neutral">{compensationLabel}</Chip>
          )}
          {audition.selfTapeEnabled && (
            <Chip variant="selftape">
              <Video className="inline size-2.5 shrink-0" />
              {audition.selfTapeRequired
                ? 'Self-tape required'
                : 'Self-tape optional'}
            </Chip>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4b535c]">
          {audition.description}
        </p>

        {/* Footer: applicant count + deadline + CTA */}
        <div className="mt-4 flex flex-col gap-3 border-t border-[#e8ecef] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4 text-xs font-bold text-[#69727c]">
            <span>{audition.applicantCount ?? 0} applicants</span>
            <span className="text-[#aab5bb]">·</span>
            <span>Closes {formatDate(audition.deadline)}</span>
          </div>
          <Link
            href={`/auditions/${audition.id}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#07111f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#008ca6] sm:w-auto"
          >
            View casting brief
          </Link>
        </div>
      </div>
    </article>
  );
}

// Chip variants for metadata tags
function Chip({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'trust' | 'new' | 'urgent' | 'category' | 'selftape' | 'neutral';
}) {
  const classes: Record<typeof variant, string> = {
    trust: 'border border-[#9fc9c4] bg-[#edf7f5] text-[#006b60]',
    new: 'border border-[#9bbdd8] bg-[#eef5fb] text-[#1d4f73]',
    urgent: 'border border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]',
    category: 'border border-[#9fc9c4] bg-[#edf7f5] text-[#008ca6]',
    selftape: 'border border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]',
    neutral: 'border border-[#d5dee3] bg-[#f4f6f8] text-[#4e5e66]',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${classes[variant]}`}>
      {children}
    </span>
  );
}

const WORK_MODE_LABELS = {
  ONSITE: 'Onsite',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
} as const;

const PAYMENT_LABELS = {
  PAID: 'Paid',
  HONORARIUM: 'Honorarium',
  UNPAID: 'Unpaid',
  UNSPECIFIED: 'Compensation not specified',
} as const;

function getCompensationLabel(audition: Audition) {
  if (audition.paymentType && audition.paymentType !== 'UNSPECIFIED') {
    return PAYMENT_LABELS[audition.paymentType];
  }
  if (audition.payInfo?.trim()) {
    return 'Compensation listed';
  }
  return audition.paymentType === 'UNSPECIFIED'
    ? PAYMENT_LABELS.UNSPECIFIED
    : '';
}

function isDeadlineSoon(deadline: Audition['deadline']) {
  const date = toDate(deadline);
  if (!date) return false;
  const daysRemaining = (date.getTime() - Date.now()) / 86_400_000;
  return daysRemaining >= 0 && daysRemaining <= 7;
}

function isPostedRecently(createdAt: Audition['createdAt']) {
  const date = toDate(createdAt);
  if (!date) return false;
  const ageDays = (Date.now() - date.getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= 7;
}

function toDate(value: Audition['deadline'] | Audition['createdAt']) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    const date = value.toDate();
    return date instanceof Date ? date : null;
  }
  return null;
}
