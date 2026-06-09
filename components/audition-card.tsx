import Link from 'next/link';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type Audition,
} from '@/app/lib/types';
import { StatusBadge } from './status-badge';

export function AuditionCard({ audition }: { audition: Audition }) {
  return (
    <article className="border border-[#d9dee5] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1f5f91]">
            {audition.recruiterName ?? 'Verified recruiter'}
          </p>
          <h2 className="mt-1 text-xl font-bold">{audition.title}</h2>
        </div>
        <StatusBadge status={audition.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5d6670]">
        <span>{CATEGORY_LABELS[audition.category]}</span>
        <span>{EXPERIENCE_LABELS[audition.experienceLevel]}</span>
        <span>{audition.location}</span>
        <span>Deadline {formatDate(audition.deadline)}</span>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#4b535c]">
        {audition.description}
      </p>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-[#69727c]">
          {audition.applicantCount ?? 0} applicants
        </span>
        <Link
          href={`/auditions/${audition.id}`}
          className="bg-[#2e75b6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#245f95]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
