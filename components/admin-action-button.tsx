'use client';

import { useState } from 'react';
import { runAdminAction } from '@/app/lib/admin-client';

export function AdminActionButton({
  action,
  targetId,
  label,
  tone = 'primary',
  onComplete,
}: {
  action: string;
  targetId: string;
  label: string;
  tone?: 'primary' | 'danger' | 'secondary';
  onComplete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const execute = async () => {
    const reason = window.prompt(`Reason or review note for "${label}"`) ?? '';
    if (
      !reason.trim() &&
      [
        'reject_recruiter',
        'suspend_recruiter',
        'reject_talent',
        'suspend_talent',
        'suspend_user',
        'remove_audition',
        'disable_public_profile',
        'block_conversation',
        'dismiss_report',
        'resolve_report',
        'hide_reported_media',
        'remove_reported_audition',
        'disable_reported_public_profile',
        'block_reported_conversation',
        'hide_reported_message',
        'suspend_reported_user',
      ].includes(action)
    ) {
      setError('A reason is required for this action.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await runAdminAction(action, targetId, reason);
      onComplete();
    } catch {
      setError('We could not complete this action. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const style =
    tone === 'danger'
      ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
      : tone === 'secondary'
        ? 'border-[#b8c7cd] bg-white text-[#07111f] hover:border-[#008ca6]'
        : 'border-[#008ca6] bg-[#008ca6] text-white hover:bg-[#006d82]';

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void execute()}
        className={`min-h-10 border px-3 text-xs font-black disabled:opacity-50 ${style}`}
      >
        {busy ? 'Working...' : label}
      </button>
      {error && <p className="mt-1 max-w-xs text-xs text-red-700">{error}</p>}
    </div>
  );
}
