import { Bookmark } from 'lucide-react';
import Link from 'next/link';
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
    <article className="surface group overflow-hidden rounded-md p-4 hover:border-[#8dbbb6] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-[#008ca6] sm:text-sm sm:normal-case">
            {audition.recruiterName ?? 'Recruiter'}
            {audition.recruiterVerified && <VerifiedBadge />}
          </p>
          <h2 className="mt-1 text-lg font-black leading-snug sm:text-xl">
            {audition.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {recommendationScore !== undefined && recommendationScore > 0 && (
            <span className="bg-[#fff4d6] px-2.5 py-1 text-xs font-bold text-[#8a5b00]">
              {recommendationScore}% match
            </span>
          )}
          {applied && (
            <span className="border border-[#9fc9c4] bg-[#edf7f5] px-2.5 py-1 text-xs font-black uppercase text-[#006d7f]">
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
              className="flex size-9 items-center justify-center border border-[#cbd6db] bg-white disabled:opacity-50"
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
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#536066]">
        {audition.recruiterVerified && (
          <span className="border border-[#9fc9c4] bg-[#edf7f5] px-2.5 py-1 text-[#006d7f]">
            Verified recruiter
          </span>
        )}
        {postedRecently && (
          <span className="border border-[#d4e5ea] bg-white px-2.5 py-1 text-[#1f5f91]">
            New
          </span>
        )}
        {deadlineSoon && (
          <span className="border border-[#f2c46b] bg-[#fff4d6] px-2.5 py-1 text-[#8a5b00]">
            Deadline soon
          </span>
        )}
        <span className="bg-[#edf7f5] px-2.5 py-1 text-[#008ca6]">
          {CATEGORY_LABELS[audition.category]}
        </span>
        <span className="bg-[#f0f1ee] px-2.5 py-1">
          {EXPERIENCE_LABELS[audition.experienceLevel]}
        </span>
        <span className="bg-[#f0f1ee] px-2.5 py-1">{audition.location}</span>
        {audition.workMode && (
          <span className="bg-[#f0f1ee] px-2.5 py-1">
            {WORK_MODE_LABELS[audition.workMode]}
          </span>
        )}
        {compensationLabel && (
          <span className="bg-[#f0f1ee] px-2.5 py-1">
            {compensationLabel}
          </span>
        )}
        {audition.selfTapeEnabled && (
          <span className="bg-[#fff4d6] px-2.5 py-1 text-[#8a5b00]">
            {audition.selfTapeRequired
              ? 'Self-tape required'
              : 'Self-tape optional'}
          </span>
        )}
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#4b535c]">
        {audition.description}
      </p>
      <div className="mt-5 flex flex-col gap-3 border-t border-[#e5e8e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#69727c]">
          <span>{audition.applicantCount ?? 0} applicants</span>
          <span className="mx-2">·</span>
          <span>Closes {formatDate(audition.deadline)}</span>
        </div>
        <Link
          href={`/auditions/${audition.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#07111f] px-4 py-2 text-sm font-bold text-white group-hover:bg-[#008ca6] sm:w-auto"
        >
          View details
        </Link>
      </div>
    </article>
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
