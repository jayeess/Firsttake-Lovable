'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

export function EmailVerificationPrompt({
  compact = false,
}: {
  compact?: boolean;
}) {
  const {
    user,
    emailVerified,
    sendEmailVerification,
    refreshEmailVerification,
  } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!user || emailVerified) return null;

  const handleSend = async () => {
    setSending(true);
    setStatus('');
    setError('');
    try {
      await sendEmailVerification();
      setStatus('Verification email sent. Check your inbox, then refresh status here.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification email could not be sent.'));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setStatus('');
    setError('');
    try {
      const verified = await refreshEmailVerification();
      setStatus(
        verified
          ? 'Email verified. Your account trust status is updated.'
          : 'Still pending. Open the verification email first, then refresh again.'
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification status could not be refreshed.'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section
      id="email-verification"
      className={`scroll-mt-24 rounded-md border border-[#d8a843] bg-[#fff8df] text-sm text-[#5e4b13] ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-[#a97800]" />
          <div>
            <p className="font-black text-[#07111f]">
              Verify your email to strengthen account trust.
            </p>
            <p className="mt-1 leading-6">
              Send a Firebase verification email to {user.email}. After opening
              the link, return here and refresh your status.
            </p>
            {(status || error) && (
              <p
                className={`mt-2 font-bold ${
                  error ? 'text-red-700' : 'text-[#007c5f]'
                }`}
              >
                {error || status}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || refreshing}
            className="secondary-button bg-white disabled:opacity-50 sm:w-auto"
          >
            {sending ? 'Sending...' : 'Send verification email'}
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={sending || refreshing}
            className="primary-button disabled:opacity-50 sm:w-auto"
          >
            {refreshing ? 'Refreshing...' : 'I verified, refresh status'}
          </button>
        </div>
      </div>
    </section>
  );
}
