'use client';

import { Flag, X } from 'lucide-react';
import { useState } from 'react';
import { createReport } from '@/app/lib/reporting-client';
import {
  REPORT_REASON_CODES,
  REPORT_REASON_LABELS,
} from '@/app/lib/report-policy';
import type { ReportReasonCode, ReportTargetType } from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';

export function ReportButton({
  targetType,
  targetId,
  label = 'Report',
  compact = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] =
    useState<ReportReasonCode>('inappropriate_content');
  const [reasonText, setReasonText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      window.location.href = `/auth/login?next=${encodeURIComponent(
        window.location.pathname
      )}`;
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await createReport({
        targetType,
        targetId,
        reasonCode,
        reasonText,
      });
      setSuccess(
        result.existing
          ? 'You already have an active report for this item. It remains in review.'
          : 'Your report was received. Our trust team will review it.'
      );
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Report could not be submitted.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError('');
          setSuccess('');
        }}
        className={
          compact
            ? 'inline-flex min-h-9 items-center gap-2 text-xs font-black text-[#9b3f35] hover:text-red-700'
            : 'secondary-button inline-flex items-center gap-2'
        }
      >
        <Flag aria-hidden="true" size={compact ? 14 : 16} />
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-dialog-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/70 p-4"
        >
          <div className="w-full max-w-lg border border-[#bfd0d7] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Trust and safety</p>
                <h2 id="report-dialog-title" className="mt-2 text-2xl font-black">
                  Report a concern
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close report dialog"
                className="flex size-9 items-center justify-center border border-[#cbd6db]"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            {success ? (
              <div className="mt-6 border border-emerald-300 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                {success}
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-black">
                  What is the concern?
                  <select
                    value={reasonCode}
                    onChange={(event) =>
                      setReasonCode(event.target.value as ReportReasonCode)
                    }
                    className="field mt-2"
                  >
                    {REPORT_REASON_CODES.map((reason) => (
                      <option key={reason} value={reason}>
                        {REPORT_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-black">
                  Details {reasonCode === 'other' ? '(required)' : '(optional)'}
                  <textarea
                    value={reasonText}
                    onChange={(event) => setReasonText(event.target.value)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Share only the details needed for our trust team to understand the concern."
                    className="field mt-2 py-3"
                  />
                </label>
                <p className="text-xs leading-5 text-[#657176]">
                  Reports are private. Your identity is not shown to the reported
                  user. Do not include passwords, financial details, or unrelated
                  personal information.
                </p>
                {error && (
                  <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    busy ||
                    (reasonCode === 'other' && reasonText.trim().length < 10)
                  }
                  className="primary-button w-full disabled:opacity-50"
                >
                  {busy ? 'Submitting report...' : 'Submit report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
