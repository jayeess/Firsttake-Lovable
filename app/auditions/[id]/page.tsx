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
            message={error}
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
      <Link href="/auditions" className="text-sm font-semibold text-[#1f5f91]">
        Back to auditions
      </Link>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="border border-[#d9dee5] bg-white p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-[#1f5f91]">
                {audition.recruiterName ?? 'Recruiter'}
                {audition.recruiterVerified && <VerifiedBadge />}
              </p>
              <h1 className="mt-2 text-3xl font-bold">{audition.title}</h1>
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
                  className="flex size-10 items-center justify-center border border-[#cbd6db] bg-white disabled:opacity-50"
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
          </div>
          <Section title="About the role" body={audition.description} />
          <Section title="Requirements" body={audition.requirements} />
          {audition.payInfo && <Section title="Compensation" body={audition.payInfo} />}
        </article>
        <aside className="h-fit border border-[#d9dee5] bg-white p-5">
          <h2 className="text-xl font-bold">Apply for this role</h2>
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
              <label className="mt-5 block text-sm font-semibold">
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
              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
              <button
                type="button"
                disabled={applying || audition.status !== 'ACTIVE'}
                onClick={handleApply}
                className="mt-4 h-12 w-full bg-[#008ca6] font-semibold text-white disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit application'}
              </button>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-bold uppercase text-[#78838e]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Section({ title, body }: { title: string; body: string }) {
  return <section className="mt-7"><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 whitespace-pre-line leading-7 text-[#4f5963]">{body}</p></section>;
}
