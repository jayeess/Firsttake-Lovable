'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 120000;

export function EmailVerificationPrompt() {
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
  const [emailSent, setEmailSent] = useState(false);
  const checkingRef = useRef(false);
  const pollStartedAtRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollStartedAtRef.current = null;
  }, []);

  const checkStatus = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (!user || emailVerified || checkingRef.current) return false;
      checkingRef.current = true;
      if (!quiet) {
        setRefreshing(true);
        setStatus('');
        setError('');
      }
      try {
        const verified = await refreshEmailVerification();
        if (verified) {
          stopPolling();
          if (!quiet) {
            setStatus('Email verified. Your account trust status is up to date.');
          }
        } else if (!quiet) {
          setStatus(
            'We could not confirm verification yet. Open the latest email link, then check again.'
          );
        }
        return verified;
      } catch (err: unknown) {
        if (!quiet) {
          setError(
            getErrorMessage(err, 'Verification status could not be checked.')
          );
        }
        return false;
      } finally {
        checkingRef.current = false;
        if (!quiet) setRefreshing(false);
      }
    },
    [emailVerified, refreshEmailVerification, stopPolling, user]
  );

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || emailVerified) return;
    pollStartedAtRef.current = Date.now();
    pollTimerRef.current = window.setInterval(() => {
      if (
        !pollStartedAtRef.current ||
        Date.now() - pollStartedAtRef.current > POLL_TIMEOUT_MS
      ) {
        stopPolling();
        return;
      }
      void checkStatus({ quiet: true });
    }, POLL_INTERVAL_MS);
  }, [checkStatus, emailVerified, stopPolling]);

  useEffect(() => {
    if (!user || emailVerified) return;
    const initialCheck = window.setTimeout(() => {
      void checkStatus({ quiet: true });
    }, 0);

    const handleFocus = () => void checkStatus({ quiet: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkStatus({ quiet: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkStatus, emailVerified, user]);

  useEffect(() => {
    if (emailVerified) stopPolling();
    return stopPolling;
  }, [emailVerified, stopPolling]);

  if (!user || emailVerified) return null;

  const handleSend = async () => {
    setSending(true);
    setStatus('');
    setError('');
    try {
      await sendEmailVerification();
      setEmailSent(true);
      setStatus(
        'Open the link in your inbox, then return here. Nata Connect will check your account status automatically.'
      );
      startPolling();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Verification email could not be sent.'));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    await checkStatus();
  };

  return (
    <section
      id="email-verification"
      className="scroll-mt-24 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-3 text-sm text-[#234b47] sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#008c80]" />
          <div className="min-w-0">
            <p className="font-black text-[#07111f]">
              {emailSent
                ? 'Verification email sent'
                : 'Verify your email to protect your account'}
            </p>
            <p className="mt-0.5 leading-5">
              {emailSent
                ? 'Open the link in your inbox, then return here.'
                : `We'll send a secure link to ${user.email}.`}
            </p>
            {emailSent && (
              <p className="mt-1 text-xs font-bold leading-5 text-[#3d6862]">
                Check Spam or Promotions if you did not receive it.
              </p>
            )}
            {(status || error) && (
              <p
                className={`mt-1 text-xs font-bold ${
                  error ? 'text-red-700' : 'text-[#007c5f]'
                }`}
              >
                {error || status}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || refreshing}
            className="primary-button min-h-10 py-2 text-sm disabled:opacity-50 sm:w-auto"
          >
            {sending
              ? 'Sending...'
              : emailSent
                ? 'Resend verification email'
                : 'Send verification email'}
          </button>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={sending || refreshing}
            className="secondary-button min-h-10 bg-white py-2 text-sm disabled:opacity-50 sm:w-auto"
          >
            {refreshing ? 'Checking...' : 'Check verification status'}
          </button>
        </div>
      </div>
    </section>
  );
}
