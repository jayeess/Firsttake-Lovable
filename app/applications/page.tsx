'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { StatusBadge } from '@/components/status-badge';
import {
  deleteApplication,
  getTalentApplications,
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

  return (
    <AppShell requiredRole="TALENT">
      <p className="eyebrow">Application tracker</p>
      <h1 className="mt-2 text-4xl font-black">My applications</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
        Follow every role from submission through recruiter review and final
        status.
      </p>

      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-[#ccd3da]">
        {tabs.map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`min-h-11 whitespace-nowrap px-4 text-sm font-bold ${
              tab === value
                ? 'border-b-2 border-[#008ca6] text-[#008ca6]'
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
          </div>
        ) : (
          filtered.map((application) => (
            (() => {
              const status = getApplicationStatus(application);
              return (
            <article
              key={`${application.auditionId}-${application.id}`}
              className="surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">
                    {application.audition?.title ?? 'Audition'}
                  </h2>
                  <p className="mt-1 text-sm text-[#68727c]">
                    {application.audition?.recruiterName ?? 'Recruiter'} ·
                    Applied {formatDate(application.createdAt)}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
              <div className="mt-5 grid grid-cols-8 gap-2">
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
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#dce2e8] pt-4">
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
                />
              {!['REJECTED', 'SELECTED', 'WITHDRAWN'].includes(status) && (
                  <button
                    type="button"
                    onClick={() => void withdraw(application)}
                    disabled={withdrawingId === application.id}
                    className="text-sm font-bold text-[#b63b32] hover:underline disabled:opacity-50"
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
