'use client';

import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  getAuditionById,
  getSavedAuditions,
  setAuditionSaved,
  submitApplication,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type Audition,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { VerifiedBadge } from '@/components/verified-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { ReportButton } from '@/components/report-button';
import { SafetyNotice } from '@/components/product-ui';

const AUDITION_TYPE_LABELS: Record<string, string> = {
  FILM: 'Film',
  SERIES: 'Series',
  COMMERCIAL: 'Commercial',
  THEATRE: 'Theatre',
  VOICE_OVER: 'Voice over',
  LIVE_EVENT: 'Live event',
  OTHER: 'Other',
};

const WORK_MODE_LABELS: Record<string, string> = {
  ONSITE: 'Onsite',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

const PAYMENT_LABELS: Record<string, string> = {
  PAID: 'Paid',
  HONORARIUM: 'Honorarium',
  UNPAID: 'Unpaid',
};

export default function AuditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, userType } = useAuth();
  const [audition, setAudition] = useState<Audition | null>(null);
  const [coverMessage, setCoverMessage] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void getAuditionById(id)
      .then(setAudition)
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load audition'))
      )
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  useEffect(() => {
    if (!user || userType !== 'TALENT') return;
    void getSavedAuditions(user.uid)
      .then((items) => setSaved(items.some((item) => item.auditionId === id)))
      .catch(() => undefined);
  }, [id, user, userType]);

  const toggleSaved = async () => {
    setSaving(true);
    setError('');
    try {
      await setAuditionSaved(id, !saved);
      setSaved((current) => !current);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update saved auditions'));
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setApplying(true);
    setError('');
    try {
      await submitApplication(id, user.uid, coverMessage);
      router.push('/applications');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to submit application'));
    } finally {
      setApplying(false);
    }
  };

  if (!audition) {
    return (
      <AppShell>
        {loading ? (
          <LoadingState label="Loading the casting brief..." />
        ) : error ? (
          <ErrorState
            title="This audition could not be loaded"
            message="We could not load this section. Try refreshing the page."
            onRetry={() => {
              setLoading(true);
              setError('');
              setReloadKey((current) => current + 1);
            }}
          />
        ) : (
          <EmptyState
            title="This audition is no longer available"
            message="It may have been closed, removed by moderation, or deleted by its recruiter."
            actionHref="/auditions"
            actionLabel="Browse active auditions"
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/auditions" className="text-sm font-bold text-[#008ca6]">
        ← Back to auditions
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="surface p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-[#008ca6]">
                {audition.recruiterName ?? 'Recruiter'}
                {audition.recruiterVerified && <VerifiedBadge />}
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{audition.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={audition.status} />
              {audition.recruiterId !== user?.uid && (
                <ReportButton
                  targetType="audition"
                  targetId={audition.id}
                  compact
                />
              )}
              {userType === 'TALENT' && (
                <button
                  type="button"
                  onClick={() => void toggleSaved()}
                  disabled={saving}
                  aria-label={saved ? 'Remove saved audition' : 'Save audition'}
                  className="flex size-10 items-center justify-center rounded-md border border-[#cbd6db] bg-white disabled:opacity-50"
                >
                  <Bookmark
                    className={`size-5 ${
                      saved
                        ? 'fill-[#008ca6] text-[#008ca6]'
                        : 'text-[#526168]'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4 border-y border-[#e1e5ea] py-5 sm:grid-cols-2">
            <Detail label="Category" value={CATEGORY_LABELS[audition.category]} />
            <Detail label="Experience" value={EXPERIENCE_LABELS[audition.experienceLevel]} />
            <Detail label="Location" value={audition.location} />
            <Detail label="Deadline" value={formatDate(audition.deadline)} />
            <Detail label="Duration" value={audition.duration} />
            <Detail label="Positions" value={String(audition.numberOfPositions)} />
            {audition.auditionType && (
              <Detail label="Project type" value={AUDITION_TYPE_LABELS[audition.auditionType] ?? audition.auditionType} />
            )}
            {audition.workMode && (
              <Detail label="Work mode" value={WORK_MODE_LABELS[audition.workMode] ?? audition.workMode} />
            )}
            {audition.paymentType && audition.paymentType !== 'UNSPECIFIED' && (
              <Detail label="Compensation" value={PAYMENT_LABELS[audition.paymentType] ?? audition.paymentType} />
            )}
            {audition.languages && audition.languages.length > 0 && (
              <Detail label="Languages" value={audition.languages.join(', ')} />
            )}
          </div>
          <Section title="About the role" body={audition.description} />
          <Section title="Requirements" body={audition.requirements} />
          {audition.selfTapeEnabled && (
            <section className="mt-7 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-5">
              <p className="eyebrow">Self-tape request</p>
              <h2 className="mt-2 text-xl font-black">
                {audition.selfTapeRequired
                  ? 'Self-tape required'
                  : 'Optional self-tape'}
              </h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-[#234b47]">
                {audition.selfTapeInstructions ||
                  'The recruiter has requested a self-tape video link for this role.'}
              </p>
              <p className="mt-3 text-sm font-bold text-[#526874]">
                Submit your application first, then add or replace your
                self-tape from My Applications.
                {audition.selfTapeMaxDurationSeconds
                  ? ` Suggested max duration: ${audition.selfTapeMaxDurationSeconds} seconds.`
                  : ''}
              </p>
            </section>
          )}
          {audition.payInfo && <Section title="Compensation details" body={audition.payInfo} />}
          <div className="mt-7">
            <SafetyNotice title="Never pay to audition">
              Legitimate casting calls on Nata Connect do not require fees, deposits, or charges at any stage. If a recruiter asks you to pay, report it immediately.
            </SafetyNotice>
          </div>
        </article>
        <aside className="surface h-fit p-5 order-first lg:order-none">
          <h2 className="text-xl font-black">Apply for this role</h2>
          {userType === 'RECRUITER' ? (
            audition.recruiterId === user?.uid ? (
              <>
                <p className="mt-3 text-sm leading-6 text-[#68727c]">
                  This is your casting call. Open the applicant pipeline to
                  review profiles and update decisions.
                </p>
                <Link
                  href={`/recruiter/auditions/${audition.id}/applicants`}
                  className="primary-button mt-5 w-full"
                >
                  Review applicants
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#68727c]">
                Recruiter accounts cannot apply to auditions.
              </p>
            )
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-[#68727c]">
                Your profile and media are included automatically. Use this
                message to stand out to the casting team.
              </p>
              {audition.status !== 'ACTIVE' && (
                <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                  This audition is no longer accepting applications.
                </p>
              )}
              <label className="mt-4 block text-sm font-bold">
                Cover message
                <textarea
                  maxLength={500}
                  rows={6}
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you fit this role."
                  className="field mt-2 py-3"
                />
              </label>
              {error && (
                <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                  Could not submit — try again in a moment.
                </p>
              )}
              <button
                type="button"
                disabled={applying || audition.status !== 'ACTIVE'}
                onClick={handleApply}
                className="primary-button mt-4 w-full"
              >
                {!user
                  ? 'Log in to apply'
                  : applying
                    ? 'Submitting...'
                    : 'Submit application'}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-[#8a9697]">
                After applying, track your status in My Applications.
              </p>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-[#7b8a90]">{label}</p>
      <p className="mt-1 font-black text-[#07111f]">{value}</p>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-7">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 whitespace-pre-line leading-7 text-[#4f5963]">{body}</p>
    </section>
  );
}
