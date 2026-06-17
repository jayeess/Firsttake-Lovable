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

const tabs: Array<ApplicationStatus | 'ALL'> = [
  'ALL',
  ...APPLICATION_PIPELINE_STATUSES,
];

export default function ApplicationsPage() {
  const { user, userType } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<ApplicationStatus | 'ALL'>('ALL');
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

  const filtered = useMemo(
    () =>
      applications.filter(
        (item) => tab === 'ALL' || getApplicationStatus(item) === tab
      ),
    [applications, tab]
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

      <div className="mt-6 flex snap-x gap-1 overflow-x-auto border-b border-[#ccd3da] pb-1">
        {tabs.map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`min-h-12 snap-start whitespace-nowrap rounded-t-md px-4 text-sm font-bold ${
              tab === value
                ? 'bg-white border-b-2 border-[#008ca6] text-[#008ca6]'
                : 'text-[#66717c]'
            }`}
          >
            {value}
          </button>
        ))}
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
            <h2 className="text-xl font-black">No applications here yet</h2>
            <p className="mt-2 text-[#68727c]">
              Browse auditions and submit your profile for a role.
            </p>
            <Link href="/auditions" className="primary-button mt-5 sm:w-auto">
              Find auditions
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
                <div>
                  <h2 className="text-lg font-black leading-snug sm:text-xl">
                    {application.audition?.title ?? 'Audition'}
                  </h2>
                  <p className="mt-1 text-sm text-[#68727c]">
                    {application.audition?.recruiterName ?? 'Recruiter'} ·
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
              <div className="mt-5 grid grid-cols-8 gap-1.5 sm:gap-2">
                {APPLICATION_PIPELINE_STATUSES.map(
                  (status) => (
                    <div
                      key={status}
                      className={`h-1.5 ${
                        status === getApplicationStatus(application)
                          ? 'bg-[#008ca6]'
                          : 'bg-[#dce2e8]'
                      }`}
                    />
                  )
                )}
              </div>
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
    <section className="mt-5 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Self-tape</p>
          <h3 className="mt-1 text-lg font-black">
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
