'use client';

import { ArrowLeft, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getConversation,
  markConversationRead,
  sendMessage,
} from '@/app/lib/messaging-client';
import { MESSAGE_MAX_LENGTH } from '@/app/lib/messaging-policy';
import {
  getMessageSafetySummary,
  getSafeConversationReminders,
} from '@/app/lib/message-safety-policy';
import type { Conversation, ConversationMessage } from '@/app/lib/types';
import { AppShell } from '@/components/app-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/context/auth-context';
import { ReportButton } from '@/components/report-button';

const messageTime = (value?: ConversationMessage['createdAt']) => {
  if (!value) return 'Sending';
  const date =
    typeof value === 'string'
      ? new Date(value)
      : value instanceof Date
        ? value
        : value.toDate();
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getInitials = (name?: string) =>
  (name ?? 'Nata Connect')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NC';

const getThreadSafetyReminder = (userType?: string | null) =>
  userType === 'RECRUITER'
    ? 'Use messages only for audition-related communication. Keep all communication on Nata Connect and never ask Talent to pay to audition.'
    : 'Keep all casting communication on Nata Connect. Never share personal contact details or financial information in messages.';

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, userType } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    void getConversation(conversationId)
      .then((result) => {
        setConversation(result.conversation);
        setMessages(result.messages);
        void markConversationRead(conversationId);
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Conversation could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, [conversationId, reloadKey, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendMessage(conversationId, body);
      setBody('');
      const result = await getConversation(conversationId);
      setConversation(result.conversation);
      setMessages(result.messages);
    } catch (sendError: unknown) {
      setError(
        sendError instanceof Error ? sendError.message : 'Message could not be sent.'
      );
    } finally {
      setSending(false);
    }
  };

  const otherName =
    userType === 'RECRUITER'
      ? conversation?.talentNameSnapshot
      : conversation?.recruiterNameSnapshot;
  const readOnly = conversation?.status !== 'active';

  const safetySummary = useMemo(
    () => (body.length > 15 ? getMessageSafetySummary(body) : null),
    [body]
  );
  const safetyCoachVisible =
    safetySummary !== null && safetySummary.band !== 'looks_professional';
  const safeReminders = getSafeConversationReminders(userType);

  return (
    <AppShell>
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm font-black text-[#008ca6]"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        All messages
      </Link>

      {loading ? (
        <LoadingState label="Opening conversation..." />
      ) : error && !conversation ? (
        <ErrorState
          title="Conversation could not be opened"
          message="We could not load this section. Try refreshing the page."
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      ) : conversation ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-md border border-[#cbd6db] bg-white shadow-sm">
            <header className="relative overflow-hidden border-b border-[#d7e0e4] bg-[#07111f] p-4 text-white sm:p-5">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(0,194,224,0.22),transparent_62%)]" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="relative z-10 flex min-w-0 gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white/10 text-sm font-black text-[#7fd0c7]">
                    {getInitials(otherName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-[#7fd0c7]">
                      {userType === 'RECRUITER' ? 'Applicant conversation' : 'Audition conversation'}
                    </p>
                    <h1 className="mt-2 truncate text-xl font-black sm:text-2xl">
                      {otherName}
                    </h1>
                    <p className="mt-1 truncate text-sm font-bold text-white/70">
                      {conversation.auditionTitleSnapshot}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <ReportButton
                    targetType="conversation"
                    targetId={conversation.id}
                    label="Report thread"
                    compact
                  />
                  <StatusBadge status={conversation.applicationStatus} />
                </div>
              </div>
            </header>

            <div className="h-[48vh] min-h-[260px] overflow-y-auto bg-[#eef4f7] p-3 lg:h-[52vh] sm:p-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="rounded-md border border-[#d5e2e7] bg-white p-6 shadow-sm">
                    <MessageCircle className="mx-auto size-8 text-[#008ca6]" />
                    <h2 className="mt-3 font-black">Start the conversation</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#68777e]">
                      Ask about the audition, availability, self-tape guidance,
                      or next casting steps.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages
                    .filter((message) => message.moderationStatus === 'active')
                    .map((message) => {
                      const mine = message.senderId === user?.uid;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-[90%] gap-2 sm:max-w-[82%] ${mine ? 'flex-row-reverse' : ''}`}>
                            <span
                              className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                mine
                                  ? 'bg-[#008ca6] text-white'
                                  : 'bg-white text-[#008ca6]'
                              }`}
                            >
                              {mine ? 'You' : getInitials(otherName).slice(0, 2)}
                            </span>
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-sm ${
                                mine
                                  ? 'rounded-tr-md bg-[#083348] text-white'
                                  : 'rounded-tl-md border border-[#d0dde2] bg-white'
                              }`}
                            >
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.body}
                            </p>
                            <p
                              className={`mt-2 text-[10px] font-bold ${
                                mine ? 'text-white/55' : 'text-[#839097]'
                              }`}
                            >
                              {messageTime(message.createdAt)}
                            </p>
                            {!mine && (
                              <div className="mt-1">
                                <ReportButton
                                  targetType="message"
                                  targetId={`${conversation.id}:${message.id}`}
                                  label="Report message"
                                  compact
                                />
                              </div>
                            )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <form onSubmit={submit} className="border-t border-[#d7e0e4] bg-white p-3 sm:p-4">
              {readOnly && (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                  <ShieldCheck className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
                  This conversation is read-only. The application is no longer active.
                </div>
              )}
              {error && (
                <p className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                  We could not complete this action. Try again in a moment.
                </p>
              )}
              {safetyCoachVisible && safetySummary && (
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3" role="status" aria-live="polite">
                  <p className="text-xs font-black text-amber-900">
                    {safetySummary.bandLabel} — review before sending
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {safetySummary.flaggedSignals.map((signal) => (
                      <li key={signal.key} className="text-xs leading-5 text-amber-800">
                        · {signal.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mb-3 flex items-start gap-2 rounded-md bg-[#f7fbfc] p-3 text-xs leading-5 text-[#657176]">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#008ca6]" />
                <p>
                  {getThreadSafetyReminder(userType)}
                </p>
              </div>
              <div className="flex items-end gap-2 sm:gap-3">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={3}
                  disabled={readOnly}
                  placeholder={
                    readOnly
                      ? 'This conversation is read-only.'
                      : 'Message about the role, next steps, or self-tape.'
                  }
                  className="field min-h-20 resize-y rounded-md py-3 disabled:bg-[#edf1f3] sm:min-h-24"
                />
                <button
                  type="submit"
                  disabled={sending || readOnly || !body.trim()}
                  aria-label="Send message"
                  className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#008ca6] text-white shadow-sm transition hover:bg-[#007891] disabled:opacity-40"
                >
                  <Send aria-hidden="true" size={19} />
                </button>
              </div>
              <p className="mt-2 text-right text-xs text-[#7b898f]">
                {body.length}/{MESSAGE_MAX_LENGTH}
              </p>
            </form>
          </section>

          <aside className="h-fit rounded-md border border-[#cbd6db] bg-white p-4 shadow-sm sm:p-5">
            <p className="eyebrow">Casting context</p>
            <h2 className="mt-2 text-lg font-black">
              {conversation.auditionTitleSnapshot}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#657176]">
              This conversation is linked to the casting call application. Keep
              next steps and decisions here for a clear, shared record.
            </p>

            <div className="mt-4 rounded-md border border-[#bad7d3] bg-[#edf7f5] p-3">
              <p className="text-xs font-black uppercase text-[#008ca6]">
                Safe messaging
              </p>
              <ul className="mt-2 space-y-1.5">
                {safeReminders.map((reminder, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-xs leading-5 text-[#234b47]"
                  >
                    <span
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-[#008ca6]"
                      aria-hidden="true"
                    />
                    {reminder}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-md border border-[#d7e0e4] p-3 text-sm">
              <p className="font-black">Application status</p>
              <div className="mt-2">
                <StatusBadge status={conversation.applicationStatus} />
              </div>
            </div>
            <Link
              href={
                userType === 'RECRUITER'
                  ? `/recruiter/auditions/${conversation.auditionId}/applicants`
                  : '/applications'
              }
              className="secondary-button mt-5 flex justify-center"
            >
              {userType === 'RECRUITER' ? 'Open applicant review' : 'View in My Applications'}
            </Link>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}
