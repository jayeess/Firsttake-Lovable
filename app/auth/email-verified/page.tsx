'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { AuthFrame } from '@/components/auth-frame';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';

type VerificationCheckState = 'checking' | 'pending' | 'error';

export default function EmailVerifiedPage() {
  const {
    user,
    loading,
    emailVerified,
    refreshEmailVerification,
  } = useAuth();
  const [checkState, setCheckState] =
    useState<VerificationCheckState>('checking');
  const [message, setMessage] = useState('');
  const checkedRef = useRef(false);

  useEffect(() => {
    if (loading || checkedRef.current) return;
    checkedRef.current = true;

    if (!user || emailVerified) return;

    void refreshEmailVerification()
      .then((verified) => {
        setCheckState(verified ? 'checking' : 'pending');
      })
      .catch((err: unknown) => {
        setMessage(getErrorMessage(err, 'Verification status could not be checked.'));
        setCheckState('error');
      });
  }, [emailVerified, loading, refreshEmailVerification, user]);

  const state = loading
    ? 'checking'
    : !user
      ? 'signed_out'
      : emailVerified
        ? 'verified'
        : checkState;

  const title =
    state === 'verified'
      ? 'Email verified'
      : state === 'signed_out'
        ? 'Email verification link opened'
        : state === 'pending'
          ? 'Verification not confirmed yet'
          : 'Checking your verification status...';
  const description =
    state === 'verified'
      ? 'Your FirstTake account trust status is up to date.'
      : state === 'signed_out'
        ? 'Sign in to finish updating your FirstTake account status.'
        : state === 'pending'
          ? 'We could not confirm verification yet. Return to your inbox and open the latest verification link, or sign in and check your status again.'
          : state === 'error'
            ? message
            : 'FirstTake is refreshing your secure Firebase account status.';

  return (
    <AuthFrame
      eyebrow="Account trust"
      title={title}
      description={description}
    >
      <div className="rounded-md border border-[#d7e2e6] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {state === 'verified' ? (
            <CheckCircle2 className="mt-1 size-6 shrink-0 text-emerald-700" />
          ) : (
            <MailCheck className="mt-1 size-6 shrink-0 text-[#008ca6]" />
          )}
          <div>
            <p className="font-black text-[#07111f]">
              {state === 'verified'
                ? 'You are ready to continue.'
                : 'Keep your account protected.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#657176]">
              Email verification helps keep FirstTake trusted for Talent,
              Recruiters, and casting teams.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {state === 'signed_out' ? (
            <Link href="/auth/login" className="primary-button sm:w-auto">
              Sign in
            </Link>
          ) : (
            <Link href="/dashboard" className="primary-button sm:w-auto">
              Go to dashboard
            </Link>
          )}
          {state === 'pending' && (
            <Link href="/dashboard#email-verification" className="secondary-button sm:w-auto">
              Check from dashboard
            </Link>
          )}
        </div>
      </div>
    </AuthFrame>
  );
}
