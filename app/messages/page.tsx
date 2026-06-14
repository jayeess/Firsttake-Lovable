'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConversations } from '@/app/lib/messaging-client';
import type { Conversation } from '@/app/lib/types';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { useAuth } from '@/context/auth-context';

const formatTime = (value?: Conversation['updatedAt']) => {
  if (!value) return '';
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

export default function MessagesPage() {
  const { user, userType } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    void getConversations()
      .then((result) => setConversations(result.conversations))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Conversations could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, [reloadKey, user]);

  return (
    <AppShell>
      <p className="eyebrow">Private casting communication</p>
      <h1 className="mt-2 text-4xl font-black">Messages</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657176]">
        Application-linked conversations with verified casting teams and
        applicants. Keep personal contact details private.
      </p>

      {error && (
        <ErrorState
          title="Messages could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            setReloadKey((current) => current + 1);
          }}
        />
      )}
      <div className="mt-7 space-y-3">
        {loading ? (
          <LoadingState label="Loading conversations..." />
        ) : !error && conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            message={
              userType === 'RECRUITER'
                ? 'Open an applicant in your casting pipeline to start a conversation.'
                : 'Open one of your applications to message its verified recruiter.'
            }
          />
        ) : (
          conversations.map((conversation) => {
            const unread = user
              ? conversation.unreadBy.includes(user.uid)
              : false;
            const otherName =
              userType === 'RECRUITER'
                ? conversation.talentNameSnapshot
                : conversation.recruiterNameSnapshot;
            return (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className={`surface grid gap-4 p-5 transition hover:border-[#008ca6] sm:grid-cols-[44px_1fr_auto] ${
                  unread ? 'border-[#00a8c6] bg-white' : ''
                }`}
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-[#e5f5f8] text-[#008ca6]">
                  <MessageSquare aria-hidden="true" size={20} />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg">{otherName}</strong>
                    {unread && (
                      <span className="rounded-full bg-[#e7ad2d] px-2 py-0.5 text-[10px] font-black uppercase">
                        New
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-[#51656e]">
                    {conversation.auditionTitleSnapshot}
                  </span>
                  <span className="mt-2 block truncate text-sm text-[#68777e]">
                    {conversation.lastMessageText || 'Conversation ready'}
                  </span>
                </span>
                <span className="text-xs font-bold text-[#7b898f]">
                  {formatTime(conversation.updatedAt)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
