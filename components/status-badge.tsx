import type { ApplicationStatus, AuditionStatus } from '@/app/lib/types';

const styles: Record<ApplicationStatus | AuditionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-200 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
  DRAFT: 'bg-amber-100 text-amber-800',
  APPLIED: 'bg-blue-100 text-blue-800',
  VIEWED: 'bg-amber-100 text-amber-800',
  SHORTLISTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | AuditionStatus;
}) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
