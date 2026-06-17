'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  deleteApplication,
  getTalentApplications,
  removeSelfTape,
  submitSelfTapeLink,
} from '@/app/lib/firestore-service';
import {
  APPLICATION_PIPELINE_STATUSES,
  APPLICATION_STATUS_LABELS,
  getApplicationStatus,
} from '@/app/lib/application-pipeline';
import {
  formatDate,
  type Application,
  type ApplicationStatus,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { ApplicationMessageButton } from '@/components/application-message-button';
import { getConversations } from '@/app/lib/messaging-client';
import { getConversationId } from '@/app/lib/messaging-policy';
import {
  getSelfTapeBadgeTone,
  getSelfTapeStatus,
  SELF_TAPE_STATUS_LABELS,
  validateSelfTapeLink,
} from '@/app/lib/self-tape-policy';

type ApplicationView = 'ALL' | 'ACTIVE' | 'SHORTLISTED' | 'CLOSED';

const applicationViews: Array<{
  value: ApplicationView;
  label: string;
  description: string;
  statuses: ApplicationStatus[] | null;
}> = [
  {
    value: 'ALL',
    label: 'All',
    description: 'Every application',
    statuses: null,
  },
  {
    value: 'ACTIVE',
    label: 'Active',
    description: 'Waiting or in review',
    statuses: ['APPLIED', 'VIEWED', 'UNDER_REVIEW', 'MAYBE'],
  },
  {
    value: 'SHORTLISTED',
    label: 'Shortlisted',
    description: 'Strong progress',
    statuses: ['SHORTLISTED', 'SELECTED'],
  },
  {
    value: 'CLOSED',
    label: 'Closed',
    description: 'Ended or withdrawn',
    statuses: ['REJECTED', 'WITHDRAWN'],
  },
];

const positiveTimeline: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'SELECTED',
];

const nextStepMessages: Record<ApplicationStatus, string> = {
  APPLIED: 'Waiting for recruiter review',
  VIEWED: 'Recruiter viewed your application',
  UNDER_REVIEW: 'Your profile is being reviewed',
  MAYBE: 'Recruiter may consider you later',
  SHORTLISTED: 'You are shortlisted',
  SELECTED: 'You were selected',
  REJECTED: 'This application is closed',
  WITHDRAWN: 'You withdrew this application',
};

const emptyMessages: Record<ApplicationView, string> = {
  ALL: 'No applications yet. Apply to your first audition.',
  ACTIVE: 'No active applications right now.',
  SHORTLISTED: 'No shortlisted applications yet.',
  CLOSED: 'No closed applications yet.',
};

const getViewCount = (
  applications: Application[],
  statuses: ApplicationStatus[] | null
) =>
  applications.filter((item) => {
    const status = getApplicationStatus(item);
    return !statuses || statuses.includes(status);
  }).length;

export default function ApplicationsPage() {
  const { user, userType } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [view, setView] = useState<ApplicationView>('ALL');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>(
    'ALL'
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [withdrawingId, setWithdrawingId] = useState('');
  const [selfTapeBusyId, setSelfTapeBusyId] = useState('');
  const [selfTapeDrafts, setSelfTapeDrafts] = useState<Record<string, string>>({});
  const [unreadConversationIds, setUnreadConversationIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!user || userType !== 'TALENT') {
      return;
    }

    void Promise.all([
      getTalentApplications(user.uid),
      getConversations().catch(() => ({ conversations: [] })),
    ])
      .then(([applicationData, conversationData]) => {
        setApplications(applicationData);
        setUnreadConversationIds(
          new Set(
            conversationData.conversations
              .filter((item) => item.unreadBy.includes(user.uid))
              .map((item) => item.id)
          )
        );
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load applications'))
      )
      .finally(() => setLoading(false));
  }, [reloadKey, user, userType]);

  const activeView = applicationViews.find((item) => item.value === view);
  const filtered = useMemo(
    () =>
      applications.filter((item) => {
        const status = getApplicationStatus(item);
        return (
          (!activeView?.statuses || activeView.statuses.includes(status)) &&
          (statusFilter === 'ALL' || status === statusFilter)
        );
      }),
    [activeView, applications, statusFilter]
  );

  const withdraw = async (application: Application) => {
    if (!window.confirm('Withdraw this application?')) return;
    setWithdrawingId(application.id);
    setError('');
    try {
      await deleteApplication(application.auditionId, application.id);
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: 'WITHDRAWN',
                recruiterStatus: 'WITHDRAWN',
              }
            : item
        )
      );
    } catch (withdrawError: unknown) {
      setError(
        getErrorMessage(withdrawError, 'Unable to withdraw the application')
      );
    } finally {
      setWithdrawingId('');
    }
  };

  const updateSelfTapeInState = (
    application: Application,
    updates: Partial<Application>
  ) => {
    setApplications((current) =>
      current.map((item) =>
        item.auditionId === application.auditionId && item.id === application.id
          ? { ...item, ...updates }
          : item
      )
    );
  };

  const submitSelfTape = async (application: Application) => {
    const url =
      selfTapeDrafts[application.id] ?? application.selfTapeSubmission?.url ?? '';
    setSelfTapeBusyId(application.id);
    setError('');
    try {
      const normalizedUrl = validateSelfTapeLink(url);
      await submitSelfTapeLink(
        application.auditionId,
        application.id,
        normalizedUrl
      );
      updateSelfTapeInState(application, {
        selfTapeStatus: 'submitted',
        selfTapeSubmission: {
          type: 'link',
          url: normalizedUrl,
          updatedAt: new Date(),
          submittedAt: new Date(),
        },
        selfTapeReviewedAt: undefined,
      });
      setSelfTapeDrafts((current) => ({
        ...current,
        [application.id]: normalizedUrl,
      }));
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Unable to submit self-tape'));
    } finally {
      setSelfTapeBusyId('');
    }
  };

  const removeSelfTapeSubmission = async (application: Application) => {
    if (!window.confirm('Remove this self-tape link?')) return;
    setSelfTapeBusyId(application.id);
    setError('');
    try {
      await removeSelfTape(application.auditionId, application.id);
      const nextStatus = application.audition?.selfTapeRequired
        ? 'missing'
        : 'requested';
      updateSelfTapeInState(application, {
        selfTapeStatus: nextStatus,
        selfTapeSubmission: undefined,
        selfTapeReviewedAt: undefined,
      });
      setSelfTapeDrafts((current) => ({
        ...current,
        [application.id]: '',
      }));
    } catch (removeError: unknown) {
      setError(getErrorMessage(removeError, 'Unable to remove self-tape'));
    } finally {
      setSelfTapeBusyId('');
    }
  };

  return (
    <AppShell requiredRole="TALENT">
      <p className="eyebrow">Application tracker</p>
      <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
        My applications
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657176] sm:text-base sm:leading-7">
        Follow every role from submission through recruiter review and final
        status.
      </p>

      <div className="mt-6 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-sm sm:p-4">
        <div
          className="grid grid-cols-2 gap-1 rounded-md bg-[#f3f7f8] p-1 sm:grid-cols-4"
          role="tablist"
          aria-label="Application views"
        >
          {applicationViews.map((item) => {
            const selected = view === item.value;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setView(item.value)}
                className={`min-h-14 rounded px-3 py-2 text-left transition ${
                  selected
                    ? 'bg-white text-[#07111f] shadow-sm'
                    : 'text-[#657176] hover:text-[#008ca6]'
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-black">
                  {item.label}
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      selected
                        ? 'bg-[#e8f5f3] text-[#008ca6]'
                        : 'bg-white text-[#657176]'
                    }`}
                  >
                    {getViewCount(applications, item.statuses)}
                  </span>
                </span>
                <span className="mt-1 block text-xs font-semibold">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-[#e1e5ea] pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-[#008ca6]">
              Status filter
            </p>
            <p className="mt-1 text-sm text-[#657176]">
              Use this when you need one exact internal status.
            </p>
          </div>
          <label className="text-sm font-bold sm:min-w-64">
            <span className="sr-only">Detailed application status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ApplicationStatus | 'ALL')
              }
              className="field mt-0 rounded-md text-sm"
            >
              <option value="ALL">Any status</option>
              {APPLICATION_PIPELINE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-bold">Applications could not be loaded</p>
          <p className="mt-1">
            {error.includes('index')
              ? 'The Firestore application index or security rules have not finished deploying.'
              : error}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError('');
              setReloadKey((current) => current + 1);
            }}
            className="mt-3 border border-amber-500 px-4 py-2 font-bold transition hover:bg-amber-100"
          >
            Try again
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm font-semibold text-[#657176]">
            Loading your applications...
          </p>
        ) : error ? null : filtered.length === 0 ? (
          <div className="surface border-dashed p-10 text-center">
            <h2 className="text-xl font-black">
              {statusFilter === 'ALL'
                ? emptyMessages[view]
                : 'No applications match this status filter.'}
            </h2>
            <p className="mt-2 text-[#68727c]">
              Browse auditions and submit your profile for a role.
            </p>
            <Link href="/auditions" className="primary-button mt-5 sm:w-auto">
              Browse auditions
            </Link>
          </div>
        ) : (
          filtered.map((application) => (
            (() => {
              const status = getApplicationStatus(application);
              return (
            <article
              key={`${application.auditionId}-${application.id}`}
              className="surface rounded-md p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-black leading-snug sm:text-xl">
                    {application.audition?.title ?? 'Audition'}
                  </h2>
                  <p className="mt-1 text-sm text-[#68727c]">
                    {application.audition?.recruiterName ?? 'Recruiter'} -
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
              <div className="mt-4 rounded-md border border-[#d9e4e6] bg-[#f7fbfb] p-3">
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  Next step
                </p>
                <p className="mt-1 text-sm font-bold text-[#183139]">
                  {nextStepMessages[status]}
                </p>
              </div>

              <ApplicationProgress status={status} />
              {status === 'REJECTED' &&
                application.rejectionReason && (
                  <p className="mt-4 border-l-2 border-[#e7ad2d] pl-4 text-sm leading-6 text-[#59666b]">
                    <span className="font-bold text-[#07111f]">
                      Recruiter feedback:
                    </span>{' '}
                    {application.rejectionReason}
                  </p>
                )}
              {application.audition?.selfTapeEnabled && (
                <SelfTapePanel
                  application={application}
                  draftUrl={
                    selfTapeDrafts[application.id] ??
                    application.selfTapeSubmission?.url ??
                    ''
                  }
                  busy={selfTapeBusyId === application.id}
                  onDraftChange={(value) =>
                    setSelfTapeDrafts((current) => ({
                      ...current,
                      [application.id]: value,
                    }))
                  }
                  onSubmit={() => void submitSelfTape(application)}
                  onRemove={() => void removeSelfTapeSubmission(application)}
                />
              )}
              <div className="mt-5 flex flex-col gap-3 border-t border-[#dce2e8] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                <ApplicationMessageButton
                  auditionId={application.auditionId}
                  applicationId={application.id}
                  label={
                    status === 'WITHDRAWN'
                      ? 'Conversation unavailable'
                      : unreadConversationIds.has(
                            getConversationId(
                              application.auditionId,
                              application.id
                            )
                          )
                        ? 'Message Recruiter (new)'
                        : 'Message Recruiter'
                  }
                  disabled={status === 'WITHDRAWN'}
                  className="w-full sm:w-auto"
                />
              {!['REJECTED', 'SELECTED', 'WITHDRAWN'].includes(status) && (
                  <button
                    type="button"
                    onClick={() => void withdraw(application)}
                    disabled={withdrawingId === application.id}
                    className="min-h-11 text-left text-sm font-bold text-[#b63b32] hover:underline disabled:opacity-50 sm:min-h-0"
                  >
                    {withdrawingId === application.id
                      ? 'Withdrawing...'
                      : 'Withdraw application'}
                  </button>
              )}
              </div>
            </article>
              );
            })()
          ))
        )}
      </div>
    </AppShell>
  );
}

function SelfTapePanel({
  application,
  draftUrl,
  busy,
  onDraftChange,
  onSubmit,
  onRemove,
}: {
  application: Application;
  draftUrl: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  onRemove: () => void;
}) {
  const status = getSelfTapeStatus(application, application.audition);
  const locked =
    getApplicationStatus(application) === 'WITHDRAWN' ||
    isDeadlinePassed(application.audition?.deadline);
  return (
    <section className="mt-5 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Self-tape</p>
          <h3 className="mt-1 text-base font-black sm:text-lg">
            {application.audition?.selfTapeRequired
              ? 'Required self-tape'
              : 'Optional self-tape'}
          </h3>
        </div>
        <span
          className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-black uppercase ${selfTapeToneClass(
            getSelfTapeBadgeTone(status)
          )}`}
        >
          {SELF_TAPE_STATUS_LABELS[status]}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#234b47]">
        {application.audition?.selfTapeInstructions ||
          'Submit an unlisted or private video link for this role.'}
      </p>
      {application.audition?.selfTapeMaxDurationSeconds && (
        <p className="mt-2 text-xs font-bold uppercase text-[#657176]">
          Suggested max duration:{' '}
          {application.audition.selfTapeMaxDurationSeconds} seconds
        </p>
      )}
      <label className="mt-4 block text-sm font-black">
        Self-tape video link
        <input
          className="field mt-2 bg-white"
          value={draftUrl}
          onChange={(event) => onDraftChange(event.target.value)}
          disabled={locked || busy}
          placeholder="https://vimeo.com/... or unlisted YouTube link"
          maxLength={500}
        />
      </label>
      {application.selfTapeSubmission?.url && (
        <a
          href={application.selfTapeSubmission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-black text-[#008ca6]"
        >
          Open submitted self-tape
        </a>
      )}
      {locked && (
        <p className="mt-3 text-sm font-bold text-[#657176]">
          Self-tape changes are locked because this application is no longer
          active or the deadline has passed.
        </p>
      )}
      {!locked && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className="primary-button sm:w-auto disabled:opacity-60"
          >
            {busy
              ? 'Saving...'
              : application.selfTapeSubmission?.url
                ? 'Replace self-tape'
                : 'Submit self-tape'}
          </button>
          {application.selfTapeSubmission?.url && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="secondary-button sm:w-auto disabled:opacity-60"
            >
              Remove self-tape
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ApplicationProgress({ status }: { status: ApplicationStatus }) {
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return (
      <div className="mt-4 rounded-md border border-[#dce2e8] bg-[#f6f7f8] p-3 text-sm text-[#59666b]">
        <span className="font-black text-[#07111f]">Closed state:</span>{' '}
        {nextStepMessages[status]}
      </div>
    );
  }

  if (status === 'MAYBE') {
    return (
      <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
        <span className="font-black">Review pool:</span> This is still active,
        but it is not a final selection.
      </div>
    );
  }

  const currentIndex = positiveTimeline.indexOf(status);

  return (
    <div className="mt-5" aria-label="Application progress">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {positiveTimeline.map((item, index) => {
          const reached = index <= currentIndex;
          const current = item === status;
          return (
            <div key={item} className="min-w-0">
              <div
                className={`h-2 rounded-full ${
                  reached ? 'bg-[#008ca6]' : 'bg-[#dce2e8]'
                }`}
              />
              <p
                className={`mt-2 break-words text-[0.68rem] font-black leading-tight sm:text-xs ${
                  current ? 'text-[#008ca6]' : 'text-[#657176]'
                }`}
              >
                {APPLICATION_STATUS_LABELS[item]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isDeadlinePassed(deadline?: unknown) {
  if (!deadline) return false;
  if (deadline instanceof Date) {
    return deadline.getTime() <= Date.now();
  }
  if (
    typeof deadline === 'object' &&
    deadline !== null &&
    'toDate' in deadline &&
    typeof deadline.toDate === 'function'
  ) {
    const date = deadline.toDate();
    return date instanceof Date && date.getTime() <= Date.now();
  }
  return false;
}

function selfTapeToneClass(tone: string) {
  return tone === 'danger'
    ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'attention'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-[#d3dde2] bg-white text-[#657176]';
}
