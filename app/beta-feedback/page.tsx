'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { PublicFooter } from '@/components/public-footer';
import {
  BETA_FEEDBACK_TYPES,
  BETA_FEEDBACK_SEVERITIES,
  type BetaFeedbackType,
  type BetaFeedbackSeverity,
} from '@/app/lib/beta-feedback-policy';
import { useAuth } from '@/context/auth-context';

const typeLabels: Record<BetaFeedbackType, string> = {
  bug: 'Bug — something is broken',
  confusion: 'Confusing flow — unclear or disorienting',
  feature_request: 'Missing feature — something I expected',
  performance: 'Performance issue — slow or unresponsive',
  safety: 'Safety concern — harmful or risky content',
  general: 'General feedback',
};

const severityLabels: Record<BetaFeedbackSeverity, string> = {
  low: 'Low — minor, does not block me',
  medium: 'Medium — noticeable, slows me down',
  high: 'High — serious, hard to work around',
  blocking: 'Blocking — cannot continue without a fix',
};

export default function BetaFeedbackPage() {
  const { user, userType } = useAuth();
  const [type, setType] = useState<BetaFeedbackType>('general');
  const [severity, setSeverity] = useState<BetaFeedbackSeverity>('medium');
  const [rating, setRating] = useState('');
  const [route, setRoute] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('saving');
    setError('');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user) {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      }
      const response = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          severity,
          rating,
          route,
          contactEmail,
          message,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Feedback could not be submitted.');
      }
      setStatus('success');
      setMessage('');
      setRoute('');
      setRating('');
      setSeverity('medium');
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Feedback could not be submitted.'
      );
      setStatus('idle');
    }
  };

  return (
    <main className="min-h-screen bg-[#eef4f7] text-[#07111f]">
      <header className="border-b border-[#d5e0e5] bg-white/88 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo />
          </Link>
          <Link
            href="/safety"
            className="rounded-md border border-[#b8c7cd] px-4 py-2 text-sm font-black hover:border-[#008ca6]"
          >
            Safety
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-7 px-5 py-12 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="eyebrow">Private beta — controlled rollout</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Help shape Nata Connect.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#526874]">
            You are part of a small, trusted group testing the platform before
            public launch. Your reports directly influence what gets fixed and
            what ships next.
          </p>
          <p className="mt-4 leading-7 text-[#526874]">
            Share bugs, confusing flows, performance problems, feature
            expectations, and safety signals. Please avoid adding passwords,
            government IDs, private financial details, or other sensitive
            information.
          </p>
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            For urgent danger or illegal activity, contact local emergency or
            legal authorities. Nata Connect beta support is not an emergency
            service.
          </div>
          <p className="mt-5 text-sm font-bold text-[#657176]">
            Current session:{' '}
            {user
              ? `${user.email ?? 'Signed in'} / ${userType ?? 'role loading'}`
              : 'Anonymous'}
          </p>
        </div>

        <form onSubmit={submit} className="surface rounded-md p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-black">
              Feedback type
              <select
                className="field mt-2"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as BetaFeedbackType)
                }
              >
                {BETA_FEEDBACK_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {typeLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="font-black">
              Severity
              <select
                className="field mt-2"
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as BetaFeedbackSeverity)
                }
              >
                {BETA_FEEDBACK_SEVERITIES.map((option) => (
                  <option key={option} value={option}>
                    {severityLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="font-black">
              Overall rating
              <select
                className="field mt-2"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
              >
                <option value="">Optional</option>
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Good</option>
                <option value="3">3 — Okay</option>
                <option value="2">2 — Difficult</option>
                <option value="1">1 — Blocked</option>
              </select>
            </label>

            <label className="font-black">
              Page or route
              <input
                className="field mt-2"
                placeholder="/auditions or profile page"
                value={route}
                maxLength={180}
                onChange={(event) => setRoute(event.target.value)}
              />
            </label>

            <label className="font-black sm:col-span-2">
              Contact email
              <input
                className="field mt-2"
                type="email"
                placeholder="Optional — if you want a follow-up"
                value={contactEmail}
                maxLength={180}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </label>
          </div>

          <label className="mt-4 block font-black">
            What happened?
            <textarea
              className="field mt-2 min-h-40"
              value={message}
              minLength={10}
              maxLength={2000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the bug, confusing step, performance problem, safety concern, or feature idea. Include steps to reproduce if relevant."
              required
            />
          </label>
          <p className="mt-2 text-xs font-bold text-[#657176]">
            {message.length}/2000 characters
          </p>

          {error && (
            <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
              {error}
            </p>
          )}
          {status === 'success' && (
            <p className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              Thank you. Your beta feedback was submitted and will be reviewed by
              the team.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="primary-button mt-5 disabled:opacity-60"
          >
            {status === 'saving' ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>
      </section>

      <PublicFooter />
    </main>
  );
}
