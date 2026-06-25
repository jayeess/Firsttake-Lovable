'use client';

import {
  ArrowRight,
  Bell,
  Bookmark,
  ClipboardList,
  Film,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import { EmailVerificationPrompt } from '@/components/email-verification-prompt';
import {
  getRecruiterAuditions,
  getRecruiterProfile,
  getSavedAuditions,
  getTalentApplications,
  getTalentProfile,
} from '@/app/lib/firestore-service';
import {
  getApplicationStatus,
} from '@/app/lib/application-pipeline';
import type {
  Application,
  ApplicationStatus,
  Audition,
  RecruiterProfile,
  SavedAudition,
  TalentProfile,
} from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';
import { hasRecruiterApproval } from '@/app/lib/recruiter-access';
import { ErrorState, LoadingState } from '@/components/async-state';
import { getConversations } from '@/app/lib/messaging-client';
import {
  getSelfTapeStatus,
  SELF_TAPE_STATUS_LABELS,
} from '@/app/lib/self-tape-policy';
import { calculateTalentProfileCompleteness } from '@/app/lib/profile-completeness';

const statusValue = (items: Application[], status: Application['status']) =>
  items.filter((item) => getApplicationStatus(item) === status).length;

const activeStatuses: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'UNDER_REVIEW',
  'MAYBE',
];

const nextStepMessages: Record<ApplicationStatus, string> = {
  APPLIED: 'Waiting for the casting team to open your application.',
  VIEWED: 'The casting team opened your application.',
  UNDER_REVIEW: 'Your profile is under active review.',
  MAYBE: 'You are in the casting pool.',
  SHORTLISTED: 'You made the shortlist.',
  CALLBACK: 'You have a callback — watch for a message.',
  FINAL_ROUND: 'You are in the final casting round.',
  SELECTED: 'You were selected. Expect a message with next steps.',
  REJECTED: 'The casting team moved forward with another applicant.',
  WITHDRAWN: 'You withdrew this application.',
};

export default function Dashboard() {
  const router = useRouter();
  const { user, userType, loading, error, emailVerified } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [savedAuditions, setSavedAuditions] = useState<SavedAudition[]>([]);
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [unreadConversationCount, setUnreadConversationCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user || !userType) return;
    if (userType === 'TALENT') {
      void Promise.all([
        getTalentApplications(user.uid),
        getTalentProfile(user.uid),
        getSavedAuditions(user.uid).catch(() => []),
        getConversations().catch(() => ({ conversations: [] })),
      ]).then(([items, profileData, savedItems, conversationData]) => {
        setApplications(items);
        setProfile(profileData);
        setSavedAuditions(savedItems);
        setFirstName(profileData?.firstName ?? '');
        setUnreadConversationCount(
          conversationData.conversations.filter((item) =>
            item.unreadBy.includes(user.uid)
          ).length
        );
      }).catch((loadError: unknown) => {
        setDataError(
          loadError instanceof Error
            ? loadError.message
            : 'Your workspace data could not be loaded.'
        );
      }).finally(() => setDataLoading(false));
    } else if (userType === 'RECRUITER') {
      void Promise.all([
        getRecruiterProfile(user.uid),
        getRecruiterAuditions(user.uid),
      ]).then(([rProfile, items]) => {
        if (!rProfile) {
          router.replace('/recruiter/profile');
          return;
        }
        if (!hasRecruiterApproval(user.uid, rProfile)) {
          router.replace('/recruiter/verification');
          return;
        }
        setRecruiterProfile(rProfile);
        setAuditions(items);
      }).catch((loadError: unknown) => {
        setDataError(
          loadError instanceof Error
            ? loadError.message
            : 'Your workspace data could not be loaded.'
        );
      }).finally(() => setDataLoading(false));
    }
  }, [reloadKey, router, user, userType]);

  const recruiterStats = useMemo(
    () => [
      ['Auditions posted', auditions.length],
      ['Active auditions', auditions.filter((item) => item.status === 'ACTIVE').length],
      ['Total applicants', auditions.reduce((sum, item) => sum + (item.applicantCount || 0), 0)],
    ],
    [auditions]
  );

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] font-bold text-[#536066]">Preparing your workspace...</main>;
  }

  return (
    <AppShell>
      {userType === 'RECRUITER' && (
        <section
          className="relative overflow-hidden rounded-md bg-[#07111f] bg-cover bg-center p-5 text-white sm:p-6"
          style={{ backgroundImage: "url('/nata-connect-brand-poster.png')" }}
        >
          <div className="absolute inset-0 bg-[#10191d]/70" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#7fd0c7]">
                Recruiter workspace
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                Manage your casting pipeline.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/75">
                Post verified auditions, review Talent profiles and self-tapes,
                shortlist applicants, and keep safer conversations moving.
              </p>
            </div>
            <Link href="/recruiter/auditions/new" className="primary-button sm:w-auto">
              Post a casting brief
            </Link>
          </div>
        </section>
      )}

      {error && (
        <p className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          We could not confirm account access. Try refreshing the page.
        </p>
      )}

      {!emailVerified && userType === 'RECRUITER' && (
        <div className="mt-6">
          <EmailVerificationPrompt />
        </div>
      )}

      {dataError && (
        <ErrorState
          title="Workspace data is unavailable"
          message="We could not load this section. Try refreshing the page."
          onRetry={() => {
            setDataLoading(true);
            setDataError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      {dataLoading && <LoadingState label="Loading your workspace activity..." />}

      {!dataLoading && !dataError && (
        userType === 'TALENT' ? (
          <TalentWorkspace
            applications={applications}
            emailVerified={emailVerified}
            firstName={firstName}
            profile={profile}
            savedAuditions={savedAuditions}
            unreadConversationCount={unreadConversationCount}
          />
        ) : (
          <>
            {auditions.length === 0 && (
              <RecruiterOnboardingChecklist
                emailVerified={emailVerified}
                profileReady={Boolean(recruiterProfile?.companyName && recruiterProfile?.bio)}
              />
            )}

            <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Review applicants', 'Open your live casting calls and keep decisions moving.', '/recruiter/auditions'],
                ['Post a brief', 'Create a clear casting call with deadline, requirements, and role context.', '/recruiter/auditions/new'],
                ['Check messages', 'Reply to applicants while keeping communication protected on-platform.', '/messages'],
                ['View notifications', 'Track applicant messages, status changes, and trust updates in one place.', '/notifications'],
              ].map(([title, body, href]) => (
                <Link key={title} href={href} className="mobile-card block rounded-md p-4 hover:border-[#008ca6]">
                  <p className="eyebrow">{title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#526874]">{body}</p>
                </Link>
              ))}
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-3">
              {recruiterStats.map(([label, value], index) => (
                <article key={label} className="surface relative overflow-hidden p-4">
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${index === 0 ? 'bg-[#008ca6]' : index === 1 ? 'bg-[#d8a843]' : 'bg-[#e7ad2d]'}`} />
                  <p className="text-xs font-bold uppercase text-[#657176]">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#07111f]">{value}</p>
                  <p className="mt-1 text-xs uppercase text-[#8a9697]">Live workspace total</p>
                </article>
              ))}
            </section>

            <section className="surface mt-5">
              <div className="flex items-center justify-between gap-3 border-b border-[#e1e5ea] p-4 sm:p-5">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h2 className="mt-1 text-xl font-black">
                    Recent auditions
                  </h2>
                </div>
                <Link href="/recruiter/auditions" className="text-sm font-bold text-[#008ca6]">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-[#e1e5ea]">
                {auditions.slice(0, 5).map((audition) => (
                  <div key={audition.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div><p className="font-bold">{audition.title}</p><p className="mt-0.5 text-sm text-[#68727c]">{audition.applicantCount} applicants in pipeline</p></div>
                    <StatusBadge status={audition.status} />
                  </div>
                ))}
                {auditions.length === 0 && (
                  <p className="p-7 text-center text-[#68727c]">
                    No activity yet. Use the primary action above to get started.
                  </p>
                )}
              </div>
            </section>
          </>
        )
      )}
    </AppShell>
  );
}

function TalentWorkspace({
  applications,
  emailVerified,
  firstName,
  profile,
  savedAuditions,
  unreadConversationCount,
}: {
  applications: Application[];
  emailVerified: boolean;
  firstName: string;
  profile: TalentProfile | null;
  savedAuditions: SavedAudition[];
  unreadConversationCount: number;
}) {
  const completion = profile
    ? calculateTalentProfileCompleteness(profile).score
    : 0;
  const verificationStatus = profile?.talentVerificationStatus ?? 'not_submitted';
  const publicProfileReady = Boolean(profile?.publicProfileEnabled || profile?.isPublic);
  const missingSelfTapes = applications.filter(
    (item) =>
      item.audition?.selfTapeEnabled &&
      getSelfTapeStatus(item, item.audition) === 'missing'
  );
  const submittedSelfTapes = applications.filter((item) =>
    ['submitted', 'reviewed'].includes(getSelfTapeStatus(item, item.audition))
  ).length;
  const activeApplications = applications.filter((item) =>
    activeStatuses.includes(getApplicationStatus(item))
  ).length;
  const shortlistedApplications =
    statusValue(applications, 'SHORTLISTED') +
    statusValue(applications, 'CALLBACK') +
    statusValue(applications, 'FINAL_ROUND') +
    statusValue(applications, 'SELECTED');
  const nextAction = getTalentNextAction({
    applications,
    completion,
    missingSelfTapes,
    savedAuditions,
    unreadConversationCount,
  });
  const metrics = [
    {
      label: 'Applications',
      value: applications.length,
      meaning: 'Roles you have applied to',
      href: '/applications',
    },
    {
      label: 'Active',
      value: activeApplications,
      meaning: 'Waiting or in review',
      href: '/applications',
    },
    {
      label: 'Shortlisted',
      value: shortlistedApplications,
      meaning: 'Strong recruiter signals',
      href: '/applications',
    },
    {
      label: 'Self-tapes',
      value: submittedSelfTapes,
      meaning: 'Submitted or reviewed',
      href: '/applications',
    },
    {
      label: 'Saved',
      value: savedAuditions.length,
      meaning: 'Bookmarked auditions',
      href: '/auditions?view=saved',
    },
  ];
  const readinessHints = getReadinessHints(profile, completion);

  return (
    <>
      <section
        className="relative overflow-hidden rounded-md bg-[#07111f] bg-cover bg-center p-5 text-white shadow-xl sm:p-6"
        style={{ backgroundImage: "url('/nata-connect-brand-poster.png')" }}
      >
        <div className="absolute inset-0 bg-[#051019]/75" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-black uppercase text-[#7fd0c7]">
            Talent home
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">
            Find your next casting opportunity.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
            Welcome{firstName ? `, ${firstName}` : ''}. Build your profile,
            apply to verified roles, submit self-tapes, and track every
            recruiter response in one place.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={nextAction.href} className="primary-button sm:w-auto">
              {nextAction.cta}
              <ArrowRight className="size-4" />
            </Link>
            {applications.length > 0 && nextAction.href !== '/applications' && (
              <Link href="/applications" className="secondary-button border-white/30 bg-white/10 text-white hover:bg-white/15 sm:w-auto">
                View applications
              </Link>
            )}
            {applications.length === 0 && completion < 100 && nextAction.href !== '/talent/profile' && (
              <Link href="/talent/profile" className="secondary-button border-white/30 bg-white/10 text-white hover:bg-white/15 sm:w-auto">
                Complete profile
              </Link>
            )}
          </div>
        </div>
      </section>

      {!emailVerified && (
        <div className="mt-5">
          <EmailVerificationPrompt />
        </div>
      )}

      {applications.length === 0 && (
        <TalentOnboardingChecklist
          emailVerified={emailVerified}
          completion={profile ? calculateTalentProfileCompleteness(profile).score : 0}
          hasSavedAuditions={savedAuditions.length > 0}
        />
      )}

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <article className="surface relative overflow-hidden p-4 sm:p-5">
          <div className="absolute left-0 top-0 h-full w-1 bg-[#d8a843]" />
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-[#07111f] p-2.5 text-[#7fd0c7]">
              <nextAction.Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Next best action</p>
              <h2 className="mt-1.5 text-xl font-black leading-tight">
                {nextAction.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5b6872]">
                {nextAction.body}
              </p>
              <Link href={nextAction.href} className="primary-button mt-4 sm:w-auto">
                {nextAction.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </article>

        <article className="surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Profile readiness</p>
              <h2 className="mt-1.5 text-lg font-black">Recruiter-facing trust</h2>
            </div>
            <p className="text-2xl font-black text-[#008ca6]">{completion}%</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#dce6e8]">
            <div
              className="h-2 rounded-full bg-[#008ca6]"
              style={{ width: `${Math.min(completion, 100)}%` }}
            />
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <TrustPill label="Verification" value={verificationLabel(verificationStatus)} />
            <TrustPill
              label="Public profile"
              value={publicProfileReady ? 'Enabled' : 'Not enabled'}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {readinessHints.map((hint) => (
              <p key={hint} className="text-sm leading-5 text-[#5b6872]">
                {hint}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/talent/profile" className="secondary-button sm:w-auto">
              Edit profile
            </Link>
            <Link href="/talent/profile" className="text-sm font-black text-[#008ca6] sm:self-center">
              Manage media
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Audition discovery</p>
            <h2 className="mt-1 text-xl font-black">Move from interest to application</h2>
          </div>
          <Link href="/auditions" className="hidden text-sm font-black text-[#008ca6] sm:block">
            Browse all
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: 'Browse verified auditions',
              body: 'Find structured casting calls with requirements, deadlines, and recruiter context.',
              href: '/auditions',
              Icon: Film,
            },
            {
              title: 'Return to saved roles',
              body: savedAuditions.length
                ? `${savedAuditions.length} saved audition${savedAuditions.length === 1 ? '' : 's'} waiting for review.`
                : 'Save promising auditions and revisit them before the deadline.',
              href: '/auditions?view=saved',
              Icon: Bookmark,
            },
            {
              title: 'Track applications',
              body: applications.length
                ? `${activeApplications} active application${activeApplications === 1 ? '' : 's'} still moving.`
                : 'Once you apply, every status update appears in one clear tracker.',
              href: '/applications',
              Icon: ClipboardList,
            },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="surface group block p-5 transition hover:border-[#008ca6]">
              <item.Icon className="size-5 text-[#008ca6]" />
              <h3 className="mt-3 text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#657176]">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="surface block p-4 transition hover:border-[#008ca6]"
          >
            <p className="text-xs font-black uppercase text-[#657176]">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-black text-[#07111f]">
              {metric.value}
            </p>
            <p className="mt-1 text-sm leading-5 text-[#657176]">
              {metric.meaning}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#e1e5ea] p-4 sm:p-5">
            <div>
              <p className="eyebrow">Application momentum</p>
              <h2 className="mt-1 text-xl font-black">
                Recent applications
              </h2>
            </div>
            <Link href="/applications" className="text-sm font-bold text-[#008ca6]">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#e1e5ea]">
            {applications.slice(0, 4).map((application) => (
              <RecentApplication key={`${application.auditionId}-${application.id}`} application={application} />
            ))}
            {applications.length === 0 && (
              <div className="p-8 text-center">
                <h3 className="text-lg font-black">No applications yet</h3>
                <p className="mt-2 text-sm leading-6 text-[#657176]">
                  Find a role that fits your profile and submit your first application.
                </p>
                <Link href="/auditions" className="primary-button mt-5 sm:w-auto">
                  Browse auditions
                </Link>
              </div>
            )}
          </div>
        </article>

        <div className="grid gap-3">
          <article className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Self-tapes</p>
                <h2 className="mt-1 text-lg font-black">
                  {missingSelfTapes.length ? 'Submission needed' : 'Digital auditions'}
                </h2>
              </div>
              <Video className="size-5 shrink-0 text-[#008ca6]" />
            </div>
            <p className="mt-2 text-sm leading-6 text-[#657176]">
              {missingSelfTapes.length
                ? `${missingSelfTapes.length} application${missingSelfTapes.length === 1 ? '' : 's'} need self-tape material before review.`
                : 'Self-tape requests will appear here when a role requires digital audition material.'}
            </p>
            <Link href="/applications" className="secondary-button mt-4 sm:w-auto">
              {missingSelfTapes.length ? 'Submit self-tape' : 'View applications'}
            </Link>
          </article>

          <article className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Recruiter replies</p>
                <h2 className="mt-1 text-lg font-black">
                  {unreadConversationCount ? 'Reply waiting' : 'Messages'}
                </h2>
              </div>
              <MessageCircle className="size-5 shrink-0 text-[#d8a843]" />
            </div>
            <p className="mt-2 text-sm leading-6 text-[#657176]">
              {unreadConversationCount
                ? `${unreadConversationCount} unread recruiter conversation${unreadConversationCount === 1 ? '' : 's'} need attention.`
                : 'Recruiter conversations stay organized and protected once casting teams respond.'}
            </p>
            <Link href="/messages" className="secondary-button mt-4 sm:w-auto">
              Open messages
            </Link>
          </article>

          <article className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Notifications</p>
                <h2 className="mt-1 text-lg font-black">Casting updates</h2>
              </div>
              <Bell className="size-5 shrink-0 text-[#008ca6]" />
            </div>
            <p className="mt-2 text-sm leading-6 text-[#657176]">
              Application updates, recruiter messages, and trust notices stay
              organized in your activity center.
            </p>
            <Link href="/notifications" className="secondary-button mt-4 sm:w-auto">
              View notifications
            </Link>
          </article>

          <article className="surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Saved auditions</p>
                <h2 className="mt-1 text-lg font-black">Revisit your shortlist</h2>
              </div>
              <Bookmark className="size-5 shrink-0 text-[#d8a843]" />
            </div>
            {savedAuditions.length > 0 ? (
              <div className="mt-3 space-y-2">
                {savedAuditions.slice(0, 2).map((item) => (
                  <p key={item.auditionId} className="text-sm font-bold leading-5 text-[#263943]">
                    {item.titleSnapshot}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#657176]">
                No saved auditions yet. Bookmark promising casting calls and return here later.
              </p>
            )}
            <Link href="/auditions?view=saved" className="secondary-button mt-4 sm:w-auto">
              View saved auditions
            </Link>
          </article>

          <article className="surface p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#008ca6]" />
              <div>
                <p className="eyebrow">Safety and support</p>
                <h2 className="mt-1 text-lg font-black">Audition with confidence</h2>
                <p className="mt-2 text-sm leading-6 text-[#657176]">
                  Review platform safety tips and help resources before sharing your work.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/safety" className="text-sm font-black text-[#008ca6]">
                    Safety tips
                  </Link>
                  <Link href="/help" className="text-sm font-black text-[#008ca6]">
                    Help center
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function getTalentNextAction({
  applications,
  completion,
  missingSelfTapes,
  savedAuditions,
  unreadConversationCount,
}: {
  applications: Application[];
  completion: number;
  missingSelfTapes: Application[];
  savedAuditions: SavedAudition[];
  unreadConversationCount: number;
}) {
  if (missingSelfTapes.length > 0) {
    return {
      title: 'Submit your self-tape',
      body: 'One or more active applications need a required self-tape before recruiters can fully review you.',
      cta: 'Submit self-tape',
      href: '/applications',
      Icon: Video,
    };
  }
  if (applications.length === 0) {
    return {
      title: 'Apply to your first audition',
      body: 'Start with a role that fits your category, location, and experience level.',
      cta: 'Browse auditions',
      href: '/auditions',
      Icon: Film,
    };
  }
  if (savedAuditions.length > 0 && !hasRecentApplication(applications)) {
    return {
      title: 'Turn a saved role into an application',
      body: 'You have saved auditions waiting. Revisit the strongest fit and apply before the deadline.',
      cta: 'View saved auditions',
      href: '/auditions?view=saved',
      Icon: Bookmark,
    };
  }
  if (unreadConversationCount > 0) {
    return {
      title: 'Reply to recruiter',
      body: 'You have unread conversation activity. A quick response can keep casting momentum moving.',
      cta: 'Reply to recruiter',
      href: '/messages',
      Icon: MessageCircle,
    };
  }
  if (completion < 100) {
    return {
      title: 'Complete your talent profile',
      body: 'Add the missing recruiter-facing signals: media, links, skills, languages, and public profile readiness.',
      cta: 'Complete profile',
      href: '/talent/profile',
      Icon: Sparkles,
    };
  }
  return {
    title: 'Browse new auditions',
    body: 'Your workspace is in good shape. Look for fresh roles and save the ones worth revisiting.',
    cta: 'Browse new auditions',
    href: '/auditions',
    Icon: ClipboardList,
  };
}

function hasRecentApplication(applications: Application[]) {
  const twoWeeksAgo = Date.now() - 1000 * 60 * 60 * 24 * 14;
  return applications.some((application) => {
    const timestamp = toMillis(application.createdAt ?? application.updatedAt);
    return timestamp >= twoWeeksAgo;
  });
}

function toMillis(value: Application['createdAt'] | Application['updatedAt']) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const maybeTimestamp = value as { toMillis?: unknown };
  if (typeof maybeTimestamp.toMillis === 'function') {
    return maybeTimestamp.toMillis();
  }
  return 0;
}

function getReadinessHints(profile: TalentProfile | null, completion: number) {
  if (!profile) {
    return ['Create your profile so recruiters can understand your fit before you apply.'];
  }
  const hints: string[] = [];
  if (completion < 80) {
    hints.push('Add missing profile details to improve recruiter confidence.');
  }
  if (!profile.profilePhotoUrl) {
    hints.push('Add a profile photo so casting teams can recognize you quickly.');
  }
  if (!profile.portfolioMediaCount) {
    hints.push('Upload or link portfolio media to show your range.');
  }
  if (!profile.publicProfileEnabled && !profile.isPublic) {
    hints.push('Enable your public profile when you are ready to share it.');
  }
  return hints.length ? hints.slice(0, 3) : ['Your profile is ready for recruiter review. Keep it fresh as your work grows.'];
}

function verificationLabel(status: TalentProfile['talentVerificationStatus']) {
  if (status === 'verified') return 'Verified';
  if (status === 'pending') return 'Pending';
  if (status === 'rejected') return 'Needs fixes';
  if (status === 'suspended') return 'Suspended';
  return 'Not submitted';
}

function TalentOnboardingChecklist({
  emailVerified,
  completion,
  hasSavedAuditions,
}: {
  emailVerified: boolean;
  completion: number;
  hasSavedAuditions: boolean;
}) {
  const steps = [
    {
      label: 'Verify your email',
      done: emailVerified,
      href: undefined as string | undefined,
    },
    {
      label: 'Build your talent profile (60%+ completeness)',
      done: completion >= 60,
      href: '/talent/profile',
    },
    {
      label: 'Browse or save an audition',
      done: hasSavedAuditions,
      href: '/auditions',
    },
    {
      label: 'Submit your first application',
      done: false,
      href: '/auditions',
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <article className="surface mt-5 rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Getting started</p>
          <h2 className="mt-1 text-lg font-black">Your onboarding checklist</h2>
        </div>
        <p className="shrink-0 text-sm font-black text-[#008ca6]">
          {doneCount}/{steps.length} done
        </p>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                step.done
                  ? 'bg-[#008ca6] text-white'
                  : 'border-2 border-[#c4ced4] text-[#c4ced4]'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </span>
            {step.href && !step.done ? (
              <Link href={step.href} className="text-sm font-bold text-[#008ca6] hover:underline">
                {step.label}
              </Link>
            ) : (
              <span className={`text-sm font-bold ${step.done ? 'text-[#526874] line-through' : 'text-[#07111f]'}`}>
                {step.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

function RecruiterOnboardingChecklist({ emailVerified, profileReady }: { emailVerified: boolean; profileReady: boolean }) {
  const steps = [
    { label: 'Verify your email', done: emailVerified, href: undefined as string | undefined },
    { label: 'Complete your company profile', done: profileReady, href: '/recruiter/profile' },
    { label: 'Post your first audition', done: false, href: '/recruiter/auditions/new' },
    { label: 'Review applicants', done: false, href: '/recruiter/auditions' },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <article className="surface mt-5 rounded-md p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Getting started</p>
          <h2 className="mt-1 text-lg font-black">Your onboarding checklist</h2>
        </div>
        <p className="shrink-0 text-sm font-black text-[#008ca6]">
          {doneCount}/{steps.length} done
        </p>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                step.done
                  ? 'bg-[#008ca6] text-white'
                  : 'border-2 border-[#c4ced4] text-[#c4ced4]'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </span>
            {step.href && !step.done ? (
              <Link href={step.href} className="text-sm font-bold text-[#008ca6] hover:underline">
                {step.label}
              </Link>
            ) : (
              <span className={`text-sm font-bold ${step.done ? 'text-[#526874] line-through' : 'text-[#07111f]'}`}>
                {step.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

function TrustPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#dce2e8] bg-[#f8fbfb] p-3">
      <p className="text-xs font-black uppercase text-[#657176]">{label}</p>
      <p className="mt-1 font-black text-[#07111f]">{value}</p>
    </div>
  );
}

function RecentApplication({ application }: { application: Application }) {
  const status = getApplicationStatus(application);
  const selfTapeStatus = getSelfTapeStatus(application, application.audition);
  const hasSelfTape =
    application.audition?.selfTapeEnabled || selfTapeStatus !== 'not_requested';

  return (
    <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-black leading-snug">
            {application.audition?.title ?? 'Audition'}
          </p>
          <p className="mt-1 text-sm text-[#68727c]">
            {application.audition?.recruiterName ?? 'Recruiter'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm font-bold text-[#263943]">
        {nextStepMessages[status]}
      </p>
      {hasSelfTape && (
        <p className="mt-2 inline-flex rounded-md bg-[#edf7f5] px-2.5 py-1 text-xs font-black uppercase text-[#007c8d]">
          Self-tape: {SELF_TAPE_STATUS_LABELS[selfTapeStatus]}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href="/applications" className="secondary-button sm:w-auto">
          View application
        </Link>
        <Link
          href={`/auditions/${application.auditionId}`}
          className="text-sm font-black text-[#008ca6] sm:self-center"
        >
          View audition
        </Link>
      </div>
    </div>
  );
}
