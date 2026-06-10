import Link from 'next/link';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type Audition,
} from '@/app/lib/types';
import { StatusBadge } from './status-badge';
import { VerifiedBadge } from './verified-badge';

export function AuditionCard({ audition }: { audition: Audition }) {
  return (
    <article className="surface group p-5 hover:border-[#8dbbb6]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#008ca6]">
            {audition.recruiterName ?? 'Recruiter'}
            {audition.recruiterVerified && <VerifiedBadge />}
          </p>
          <h2 className="mt-1 text-xl font-bold">{audition.title}</h2>
        </div>
        <StatusBadge status={audition.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#536066]">
        <span className="bg-[#edf7f5] px-2.5 py-1 text-[#008ca6]">{CATEGORY_LABELS[audition.category]}</span>
        <span className="bg-[#f0f1ee] px-2.5 py-1">{EXPERIENCE_LABELS[audition.experienceLevel]}</span>
        <span className="bg-[#f0f1ee] px-2.5 py-1">{audition.location}</span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#4b535c]">
        {audition.description}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-[#e5e8e5] pt-4">
        <div className="text-sm text-[#69727c]">
          <span>{audition.applicantCount ?? 0} applicants</span>
          <span className="mx-2">·</span>
          <span>Closes {formatDate(audition.deadline)}</span>
        </div>
        <Link
          href={`/auditions/${audition.id}`}
          className="bg-[#07111f] px-4 py-2 text-sm font-bold text-white group-hover:bg-[#008ca6]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
