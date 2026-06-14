'use client';

import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  getConversation,
  markConversationRead,
  sendMessage,
} from '@/app/lib/messaging-client';
import { MESSAGE_MAX_LENGTH } from '@/app/lib/messaging-policy';
import type { Conversation, ConversationMessage } from '@/app/lib/types';
import { AppShell } from '@/components/app-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/context/auth-context';

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
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      ) : conversation ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="surface overflow-hidden">
            <header className="border-b border-[#d7e0e4] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Application conversation</p>
                  <h1 className="mt-2 text-2xl font-black">{otherName}</h1>
                  <p className="mt-1 text-sm font-bold text-[#5f7078]">
                    {conversation.auditionTitleSnapshot}
                  </p>
                </div>
                <StatusBadge status={conversation.applicationStatus} />
              </div>
            </header>

            <div className="h-[52vh] min-h-[360px] overflow-y-auto bg-[#f4f8fa] p-4 sm:p-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <h2 className="font-black">Start the conversation</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#68777e]">
                      Ask about the audition, availability, self-tape guidance,
                      or next casting steps.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .filter((message) => message.moderationStatus === 'active')
                    .map((message) => {
                      const mine = message.senderId === user?.uid;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-md px-4 py-3 ${
                              mine
                                ? 'bg-[#083348] text-white'
                                : 'border border-[#d0dde2] bg-white'
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
                          </div>
                        </div>
                      );
                    })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <form onSubmit={submit} className="border-t border-[#d7e0e4] p-4">
              {error && (
                <p className="mb-3 border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}
              <p className="mb-3 text-xs leading-5 text-[#657176]">
                Keep communication inside Nata Connect for safety. Do not share
                personal contact details until you trust the other party.
              </p>
              <div className="flex items-end gap-3">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={MESSAGE_MAX_LENGTH}
                  rows={3}
                  disabled={readOnly}
                  placeholder={
                    readOnly ? 'This conversation is read-only.' : 'Write a message'
                  }
                  className="field min-h-24 resize-y py-3 disabled:bg-[#edf1f3]"
                />
                <button
                  type="submit"
                  disabled={sending || readOnly || !body.trim()}
                  aria-label="Send message"
                  className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#008ca6] text-white disabled:opacity-40"
                >
                  <Send aria-hidden="true" size={19} />
                </button>
              </div>
              <p className="mt-2 text-right text-xs text-[#7b898f]">
                {body.length}/{MESSAGE_MAX_LENGTH}
              </p>
            </form>
          </section>

          <aside className="surface h-fit p-5">
            <p className="eyebrow">Casting context</p>
            <h2 className="mt-2 text-lg font-black">
              {conversation.auditionTitleSnapshot}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#657176]">
              This thread exists only because the Talent member applied to this
              casting call.
            </p>
            <Link
              href={
                userType === 'RECRUITER'
                  ? `/recruiter/auditions/${conversation.auditionId}/applicants`
                  : '/applications'
              }
              className="secondary-button mt-5 flex justify-center"
            >
              View linked application
            </Link>
          </aside>
        </div>
      ) : null}
    </AppShell>
  );
}
