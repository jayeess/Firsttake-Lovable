import type { ApplicationStatus, AuditionStatus } from '@/app/lib/types';
import { APPLICATION_STATUS_LABELS } from '@/app/lib/application-pipeline';

// Brand-aligned status color tokens.
// Audition states use teal/gold/neutral palette.
// Application states map to the casting progression arc:
//   submitted (navy-teal) → in-review (amber) → advanced (gold) → concluded (success/muted)
const styles: Record<ApplicationStatus | AuditionStatus, string> = {
  // Audition lifecycle
  ACTIVE:
    'border border-[#9fc9c4] bg-[#edf7f5] text-[#006b60]',
  DRAFT:
    'border border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]',
  CLOSED:
    'border border-[#cdd5da] bg-[#f4f6f7] text-[#4e5e66]',
  CANCELLED:
    'border border-[#f0c5c5] bg-[#fff4f4] text-[#882222]',

  // Application submission tier
  APPLIED:
    'border border-[#9bbdd8] bg-[#eef5fb] text-[#1d4f73]',
  VIEWED:
    'border border-[#d8c06a] bg-[#fdf8e8] text-[#6e4d00]',
  UNDER_REVIEW:
    'border border-[#e8b84a] bg-[#fff8e6] text-[#714400]',
  MAYBE:
    'border border-[#c4b0f0] bg-[#f5f0ff] text-[#503ba0]',

  // Casting advancement tier (gold progression)
  SHORTLISTED:
    'border border-[#ddb840] bg-[#fdf4df] text-[#7a4400]',
  CALLBACK:
    'border border-[#d4a020] bg-[#fef0cc] text-[#7a3c00]',
  FINAL_ROUND:
    'border border-[#c08010] bg-[#feeac8] text-[#783200]',

  // Conclusions
  SELECTED:
    'border border-[#80c8a8] bg-[#edf8f2] text-[#145d3a]',
  REJECTED:
    'border border-[#e8b8b8] bg-[#fff4f4] text-[#7a2424]',
  WITHDRAWN:
    'border border-[#cdd5da] bg-[#f4f6f7] text-[#4e5e66]',
};

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | AuditionStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[status] ?? 'border border-[#cdd5da] bg-[#f4f6f7] text-[#4e5e66]'}`}
    >
      {status in APPLICATION_STATUS_LABELS
        ? APPLICATION_STATUS_LABELS[status as ApplicationStatus]
        : status.replace(/_/g, ' ')}
    </span>
  );
}
