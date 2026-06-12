import type { ApplicationStatus, AuditionStatus } from '@/app/lib/types';
import { APPLICATION_STATUS_LABELS } from '@/app/lib/application-pipeline';

const styles: Record<ApplicationStatus | AuditionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-200 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-amber-100 text-amber-800',
  APPLIED: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-cyan-100 text-cyan-900',
  SHORTLISTED: 'bg-green-100 text-green-800',
  MAYBE: 'bg-violet-100 text-violet-800',
  REJECTED: 'bg-red-100 text-red-800',
  SELECTED: 'bg-emerald-100 text-emerald-900',
  WITHDRAWN: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | AuditionStatus;
}) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status in APPLICATION_STATUS_LABELS
        ? APPLICATION_STATUS_LABELS[status as ApplicationStatus]
        : status.replace(/_/g, ' ')}
    </span>
  );
}
