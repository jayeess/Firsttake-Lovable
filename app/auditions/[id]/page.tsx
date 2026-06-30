'use client';

import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  getAuditionById,
  getSavedAuditions,
  getTalentApplicationForAudition,
  getTalentProfile,
  setAuditionSaved,
  submitApplication,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  type Application,
  type Audition,
  type ScreeningAnswer,
  type ScreeningQuestion,
  type TalentProfile,
} from '@/app/lib/types';
import {
  getApplicationStatus,
  APPLICATION_STATUS_LABELS,
} from '@/app/lib/application-pipeline';
import {
  getApplicationProofChecklist,
  getJourneyNextStep,
} from '@/app/lib/casting-journey-policy';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { VerifiedBadge } from '@/components/verified-badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { ReportButton } from '@/components/report-button';
import { NextActionPanel, SafetyNotice } from '@/components/product-ui';
import { getRoleFitSummary, type RoleFitSignalStatus } from '@/app/lib/role-fit-policy';
import {
  getCastingBriefQuality,
  type CastingBriefQualitySummary,
} from '@/app/lib/casting-brief-quality-policy';
import {
  getRecruiterTrustPassport,
  type RecruiterTrustPassport,
} from '@/app/lib/recruiter-trust-passport-policy';
import {
  getAuditionShareKit,
  getPublicOpportunitySummary,
  type AuditionShareKit,
} from '@/app/lib/audition-share-kit-policy';

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
  const [talentProfile, setTalentProfile] = useState<TalentProfile | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string | boolean | string[]>>({});

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
    void Promise.all([
      getSavedAuditions(user.uid),
      getTalentProfile(user.uid).catch(() => null),
      getTalentApplicationForAudition(id, user.uid).catch(() => null),
    ])
      .then(([items, profile, existingApp]) => {
        setSaved(items.some((item) => item.auditionId === id));
        setTalentProfile(profile);
        setExistingApplication(existingApp);
      })
      .catch(() => undefined);
  }, [id, user, userType]);

  const roleFit = useMemo(
    () =>
      talentProfile && audition
        ? getRoleFitSummary(talentProfile, audition)
        : null,
    [audition, talentProfile]
  );
  const briefQuality = useMemo(
    () => (audition ? getCastingBriefQuality(audition) : null),
    [audition]
  );
  const recruiterTrust = useMemo(
    () =>
      audition && briefQuality
        ? getRecruiterTrustPassport(null, audition, {
            briefQuality,
          })
        : null,
    [audition, briefQuality]
  );
  const shareKit = useMemo(
    () => (audition ? getAuditionShareKit(audition) : null),
    [audition]
  );

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
    const questions = audition?.screeningQuestions ?? [];
    const missingRequired = questions.filter((q) => {
      if (!q.required) return false;
      if (q.type === 'yes_no') return false;
      const ans = screeningAnswers[q.id];
      if (q.type === 'multi_choice') return !Array.isArray(ans) || (ans as string[]).length === 0;
      return typeof ans !== 'string' || ans.trim().length === 0;
    });
    if (missingRequired.length > 0) {
      setError(`Please answer ${missingRequired.length === 1 ? 'the required question' : `all ${missingRequired.length} required questions`} before submitting.`);
      return;
    }
    const answers: ScreeningAnswer[] = questions.map((q) => ({
      questionId: q.id,
      questionPromptSnapshot: q.prompt,
      type: q.type,
      answer: screeningAnswers[q.id] ?? (q.type === 'yes_no' ? false : q.type === 'multi_choice' ? [] : ''),
    }));
    setApplying(true);
    setError('');
    try {
      await submitApplication(id, user.uid, coverMessage, answers.length > 0 ? answers : undefined);
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
          {briefQuality && (
            <CastingBriefTrustPanel
              summary={briefQuality}
              recruiterVerified={audition.recruiterVerified === true}
              recruiterTrust={recruiterTrust}
            />
          )}
          {shareKit && (
            <OpportunityShareKitPanel
              audition={audition}
              shareKit={shareKit}
              isOwner={userType === 'RECRUITER' && audition.recruiterId === user?.uid}
            />
          )}
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
          <div className="mt-5">
            <NextActionPanel
              eyebrow="Safe application path"
              title="Review the brief, prepare your materials, then apply once."
              description="Use saved auditions for comparison, keep self-tape links private or unlisted, and track the recruiter decision from your application tracker."
              actionHref="/applications"
              actionLabel="Open tracker"
              secondaryHref="/talent/profile"
              secondaryLabel="Improve profile"
              icon={Bookmark}
            />
          </div>
        </article>
        <aside className="surface h-fit p-5 order-first lg:order-none">
          <h2 className="text-xl font-black">
            {existingApplication ? 'Application submitted' : 'Apply for this role'}
          </h2>
          {existingApplication ? (
            <AlreadyAppliedPanel application={existingApplication} audition={audition} />
          ) : userType === 'RECRUITER' ? (
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
              {userType === 'TALENT' && (
                <RoleReadinessPanel roleFit={roleFit} hasProfile={Boolean(talentProfile)} />
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
              {(audition.screeningQuestions ?? []).length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#008ca6]">
                    Screening questions
                  </p>
                  {audition.screeningQuestions!.map((q) => (
                    <ScreeningAnswerField
                      key={q.id}
                      question={q}
                      value={screeningAnswers[q.id]}
                      onChange={(val) =>
                        setScreeningAnswers((prev) => ({ ...prev, [q.id]: val }))
                      }
                    />
                  ))}
                  <p className="text-xs leading-5 text-[#8a9899]">
                    Answers are visible only to the recruiter and platform admins. They do not guarantee selection.
                  </p>
                </div>
              )}
              <div className="mt-4 rounded-md border border-[#d7e3e7] bg-[#f7fafb] p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#008ca6]">
                  Application pack
                </p>
                <ul className="mt-2 space-y-1.5 text-xs font-bold text-[#40535c]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#008ca6]" aria-hidden="true" />
                    Profile snapshot — category, experience, location
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#008ca6]" aria-hidden="true" />
                    Bio and professional links
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#008ca6]" aria-hidden="true" />
                    Portfolio media and showreel links
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#008ca6]" aria-hidden="true" />
                    Cover message (recommended)
                  </li>
                  {audition.selfTapeEnabled && (
                    <li className="flex items-start gap-2">
                      <span
                        className={`mt-1 size-1.5 shrink-0 rounded-full ${
                          audition.selfTapeRequired ? 'bg-amber-500' : 'bg-[#008ca6]'
                        }`}
                        aria-hidden="true"
                      />
                      Self-tape link —{' '}
                      {audition.selfTapeRequired
                        ? 'required, add from My Applications after submitting'
                        : 'optional, add from My Applications after submitting'}
                    </li>
                  )}
                </ul>
              </div>
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

function AlreadyAppliedPanel({
  application,
  audition,
}: {
  application: Application;
  audition: Audition;
}) {
  const status = getApplicationStatus(application);
  const statusLabel = APPLICATION_STATUS_LABELS[status];
  const checklist = getApplicationProofChecklist(application, audition);
  const nextStep = getJourneyNextStep(application, audition);
  const hasSelfTapePending =
    audition.selfTapeEnabled &&
    !application.selfTapeSubmission?.url;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#657176]">
          Submitted {application.createdAt ? formatDate(application.createdAt) : ''}
        </p>
        <span className="rounded-md border border-[#9fc9c4] bg-[#edf7f5] px-2.5 py-1 text-xs font-black text-[#006b60]">
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 space-y-1.5 rounded-md border border-[#d7e3e7] bg-[#f7fafb] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#008ca6]">
          Application pack
        </p>
        {checklist.map((item) => (
          <div key={item.key} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-0.5 size-3.5 shrink-0 rounded-full text-center text-[8px] font-black leading-[14px] ${
                item.included
                  ? 'bg-[#008ca6] text-white'
                  : 'border border-[#c9d5da] text-[#9aacb0]'
              }`}
            >
              {item.included ? '✓' : '–'}
            </span>
            <span className={item.included ? 'font-bold text-[#263238]' : 'text-[#9aacb0]'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {hasSelfTapePending && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          {audition.selfTapeRequired
            ? 'Self-tape required for this role — add your link from My Applications.'
            : 'Optional self-tape can be added from My Applications.'}
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-[#526874]">{nextStep}</p>
      <p className="mt-2 text-xs leading-5 text-[#526874]">
        Keep all casting communication on Nata Connect. You will never be asked to pay to be selected.
      </p>
      <p className="mt-4 text-[10px] leading-4 text-[#8a9899]">
        Platform record — not a casting guarantee or official certificate.
      </p>
      <Link href="/applications" className="primary-button mt-4 w-full">
        Track in My Applications
      </Link>
    </div>
  );
}

function OpportunityShareKitPanel({
  audition,
  shareKit,
  isOwner,
}: {
  audition: Audition;
  shareKit: AuditionShareKit;
  isOwner: boolean;
}) {
  const summary = getPublicOpportunitySummary(audition);

  return (
    <section className="mt-6 rounded-md border border-[#d3dfe3] bg-[#f5f9fa] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Opportunity page</p>
          <h2 className="mt-2 text-xl font-black">
            {summary.title}
          </h2>
        </div>
        <span
          className={`w-fit rounded-md px-2.5 py-1 text-xs font-black ${shareKitBandClass(shareKit.band)}`}
        >
          {shareKit.bandLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {summary.sourceName && (
          <div className="rounded-md border border-[#d3dfe3] bg-white p-3">
            <dt className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
              Casting source
            </dt>
            <dd className="mt-1 text-sm font-black">{summary.sourceName}</dd>
          </div>
        )}
        {summary.category && (
          <div className="rounded-md border border-[#d3dfe3] bg-white p-3">
            <dt className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
              Category
            </dt>
            <dd className="mt-1 text-sm font-black">{summary.category}</dd>
          </div>
        )}
        {summary.location && (
          <div className="rounded-md border border-[#d3dfe3] bg-white p-3">
            <dt className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
              Location
            </dt>
            <dd className="mt-1 text-sm font-black">{summary.location}</dd>
          </div>
        )}
        <div className="rounded-md border border-[#d3dfe3] bg-white p-3">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
            Apply by
          </dt>
          <dd className="mt-1 text-sm font-black">{summary.deadline}</dd>
        </div>
        <div className="rounded-md border border-[#d3dfe3] bg-white p-3">
          <dt className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
            Compensation
          </dt>
          <dd className="mt-1 text-sm font-black">{summary.compensation}</dd>
        </div>
      </dl>

      {summary.selfTapeNote && (
        <p className="mt-3 rounded-md border border-[#e0c364] bg-[#fdf9eb] px-3 py-2 text-xs font-bold leading-5 text-[#7a5500]">
          {summary.selfTapeNote}
        </p>
      )}

      {isOwner && shareKit.shareCopyTemplates.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
            Share copy
          </p>
          <ul className="mt-2 space-y-2">
            {shareKit.shareCopyTemplates.map((template, index) => (
              <li
                key={index}
                className="rounded-md border border-[#d3dfe3] bg-white px-3 py-2 text-xs leading-5 text-[#374348]"
              >
                {template}
              </li>
            ))}
          </ul>
          {shareKit.missingItems.length > 0 && (
            <p className="mt-3 text-xs font-bold text-[#657176]">
              {shareKit.missingItems.length} item{shareKit.missingItems.length === 1 ? '' : 's'} to add for a stronger opportunity page:{' '}
              {shareKit.missingItems
                .slice(0, 2)
                .map((item) => item.label)
                .join(', ')}
              {shareKit.missingItems.length > 2 ? `, +${shareKit.missingItems.length - 2} more` : ''}.
            </p>
          )}
        </div>
      )}

      <ul className="mt-4 space-y-1">
        {shareKit.publicSafetyNotes.map((note, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-xs leading-5 text-[#526874]"
          >
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#008ca6]" aria-hidden="true" />
            {note}
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-[#e1e8ec] pt-3 text-[10px] leading-4 text-[#8a9899]">
        {shareKit.disclaimer}
      </p>
    </section>
  );
}

function shareKitBandClass(band: AuditionShareKit['band']) {
  if (band === 'share_ready') return 'border border-emerald-200 bg-emerald-50 text-emerald-800';
  if (band === 'good_opportunity_page') return 'border border-[#bad7d3] bg-[#edf7f5] text-[#006b60]';
  if (band === 'needs_brief_detail') return 'border border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]';
  return 'border border-red-200 bg-red-50 text-red-800';
}

function CastingBriefTrustPanel({
  summary,
  recruiterVerified,
  recruiterTrust,
}: {
  summary: CastingBriefQualitySummary;
  recruiterVerified: boolean;
  recruiterTrust: RecruiterTrustPassport | null;
}) {
  const visibleSignals = summary.safetySignals.length
    ? summary.safetySignals
    : summary.qualitySignals
        .filter((signal) => signal.status !== 'complete')
        .slice(0, 2);

  return (
    <section className="mt-6 rounded-md border border-[#d7e3e7] bg-[#f7fafb] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Source transparency</p>
          <h2 className="mt-2 text-xl font-black">
            {recruiterTrust?.headline ?? summary.bandLabel}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#657176]">
            Talent can review who is casting, brief clarity, communication
            safety, and payment safety before applying. This is platform trust
            context, not a casting guarantee or official approval of an outcome.
          </p>
        </div>
        <span
          className={`w-fit rounded-md px-2.5 py-1 text-xs font-black ${
            recruiterTrust
              ? recruiterTrustClass(recruiterTrust.band)
              : briefQualityClass(summary.band)
          }`}
        >
          {recruiterTrust?.bandLabel ?? `${summary.score}%`}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-[#d7e3e7] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
            Casting source
          </p>
          <p className="mt-1 text-sm font-black">
            {recruiterTrust?.sourceName ?? 'Recruiter'}
          </p>
        </div>
        <div className="rounded-md border border-[#d7e3e7] bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#657176]">
            Brief quality
          </p>
          <p className="mt-1 text-sm font-black">
            {summary.bandLabel} / {summary.score}%
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-md px-2.5 py-1 text-xs font-black ${briefQualityClass(summary.band)}`}>
          {summary.score}%
        </span>
        <span className="rounded-md border border-[#bad7d3] bg-white px-2.5 py-1 text-xs font-black text-[#006b60]">
          {recruiterVerified ? 'Verified recruiter' : 'Recruiter trust pending'}
        </span>
        <span className="rounded-md border border-[#bad7d3] bg-white px-2.5 py-1 text-xs font-black text-[#006b60]">
          Keep messages on-platform
        </span>
        <span className="rounded-md border border-[#bad7d3] bg-white px-2.5 py-1 text-xs font-black text-[#006b60]">
          Never pay to audition
        </span>
      </div>
      {recruiterTrust?.publicSignals.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {recruiterTrust.publicSignals.slice(0, 4).map((signal) => (
            <div
              key={signal.key}
              className="rounded-md border border-[#d7e3e7] bg-white p-3"
            >
              <p className="text-xs font-black text-[#07111f]">
                {signal.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#657176]">
                {signal.detail}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {visibleSignals.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm font-bold leading-6 text-[#526874]">
          {visibleSignals.map((signal) => (
            <li key={signal.key} className="border-l-2 border-[#e7ad2d] pl-3">
              {signal.detail}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function recruiterTrustClass(band: RecruiterTrustPassport['band']) {
  if (band === 'verified_source' || band === 'clear_source') {
    return 'border border-[#bad7d3] bg-[#edf7f5] text-[#006b60]';
  }
  if (band === 'needs_source_detail') {
    return 'border border-amber-200 bg-amber-50 text-amber-900';
  }
  return 'border border-red-200 bg-red-50 text-red-800';
}

function briefQualityClass(band: CastingBriefQualitySummary['band']) {
  if (band === 'strong_brief') {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (band === 'good_brief') {
    return 'border border-[#bad7d3] bg-[#edf7f5] text-[#006b60]';
  }
  if (band === 'needs_detail') {
    return 'border border-amber-200 bg-amber-50 text-amber-900';
  }
  return 'border border-red-200 bg-red-50 text-red-800';
}

function RoleReadinessPanel({
  roleFit,
  hasProfile,
}: {
  roleFit: ReturnType<typeof getRoleFitSummary> | null;
  hasProfile: boolean;
}) {
  if (!hasProfile) {
    return (
      <section className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-amber-900">
          Before you apply
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-amber-950">
          Complete your Talent profile so recruiters receive a clear casting
          snapshot with your skills, languages, location, and portfolio.
        </p>
        <Link
          href="/talent/profile"
          className="mt-3 inline-flex text-sm font-black text-[#008ca6] hover:underline"
        >
          Build profile
        </Link>
      </section>
    );
  }

  if (!roleFit) return null;

  return (
    <section className="mt-4 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-[#008ca6]">
            Role readiness
          </p>
          <h3 className="mt-1 text-lg font-black text-[#07111f]">
            {roleFit.bandLabel}
          </h3>
        </div>
        <span className="rounded-md bg-white px-2.5 py-1 text-xs font-black text-[#008ca6]">
          {roleFit.score}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {roleFit.signals.slice(0, 5).map((signal) => (
          <span
            key={signal.key}
            className={`rounded-md border px-2.5 py-1 text-xs font-bold ${signalToneClass(signal.status)}`}
          >
            {signal.label}
          </span>
        ))}
      </div>
      <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-[#40535c]">
        {(roleFit.missingItems.length > 0
          ? roleFit.missingItems.slice(0, 3)
          : roleFit.checklist.slice(0, 3)
        ).map((item) => (
          <li key={item.label} className="border-l-2 border-[#00a4b8] pl-3">
            {item.detail}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-[#526874]">
        Signals are guidance only. They do not block applications or guarantee
        recruiter decisions.
      </p>
    </section>
  );
}

function signalToneClass(status: RoleFitSignalStatus) {
  if (status === 'strong') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (status === 'good') {
    return 'border-[#bad7d3] bg-white text-[#006b60]';
  }
  if (status === 'attention') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }
  return 'border-red-200 bg-red-50 text-red-800';
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

function ScreeningAnswerField({
  question,
  value,
  onChange,
}: {
  question: ScreeningQuestion;
  value: string | boolean | string[] | undefined;
  onChange: (value: string | boolean | string[]) => void;
}) {
  return (
    <div className="rounded-md border border-[#d7e3e7] bg-[#f7fafb] p-3">
      <p className="text-sm font-bold leading-5">
        {question.prompt}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </p>
      {question.helpText && (
        <p className="mt-1 text-xs leading-5 text-[#657176]">{question.helpText}</p>
      )}
      <div className="mt-2">
        {question.type === 'yes_no' && (
          <div className="flex gap-4">
            {([true, false] as const).map((bool) => (
              <label key={String(bool)} className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="radio"
                  checked={value === bool}
                  onChange={() => onChange(bool)}
                  className="accent-[#008ca6]"
                />
                {bool ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
        )}
        {question.type === 'short_text' && (
          <textarea
            rows={3}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            maxLength={600}
            className="field"
            placeholder="Your answer…"
          />
        )}
        {question.type === 'single_choice' &&
          (question.options ?? []).map((opt) => (
            <label key={opt} className="mt-1.5 flex items-center gap-2 text-sm font-bold">
              <input
                type="radio"
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-[#008ca6]"
              />
              {opt}
            </label>
          ))}
        {question.type === 'multi_choice' &&
          (question.options ?? []).map((opt) => (
            <label key={opt} className="mt-1.5 flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={Array.isArray(value) && (value as string[]).includes(opt)}
                onChange={(e) => {
                  const current = Array.isArray(value) ? (value as string[]) : [];
                  onChange(
                    e.target.checked
                      ? [...current, opt]
                      : current.filter((v) => v !== opt)
                  );
                }}
                className="accent-[#008ca6]"
              />
              {opt}
            </label>
          ))}
      </div>
    </div>
  );
}
