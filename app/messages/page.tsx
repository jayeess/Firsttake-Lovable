'use client';

import { Inbox, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getConversations } from '@/app/lib/messaging-client';
import type { Conversation } from '@/app/lib/types';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { useAuth } from '@/context/auth-context';

type InboxFilter = 'ALL' | 'UNREAD' | 'ACTIVE';

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

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NC';

export default function MessagesPage() {
  const { user, userType } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('ALL');
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

  const unreadCount = user
    ? conversations.filter((item) => item.unreadBy.includes(user.uid)).length
    : 0;
  const activeCount = conversations.filter((item) => item.status === 'active').length;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const otherName =
        userType === 'RECRUITER'
          ? conversation.talentNameSnapshot
          : conversation.recruiterNameSnapshot;
      const searchable = [
        otherName,
        conversation.auditionTitleSnapshot,
        conversation.lastMessageText,
      ]
        .join(' ')
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (filter !== 'UNREAD' || Boolean(user && conversation.unreadBy.includes(user.uid))) &&
        (filter !== 'ACTIVE' || conversation.status === 'active')
      );
    });
  }, [conversations, filter, search, user, userType]);

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-md border border-[#cbd6db] bg-white p-5 shadow-sm sm:p-6">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(0,194,224,0.16),transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Private casting communication</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Messages
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#657176] sm:text-base sm:leading-7">
              Application-linked conversations with casting teams and applicants.
              Keep personal contact details private until trust is established.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-md border border-[#dbe5e8] bg-[#f7fbfc] p-3">
              <p className="text-2xl font-black">{conversations.length}</p>
              <p className="text-xs font-black uppercase text-[#657176]">Threads</p>
            </div>
            <div className="rounded-md border border-[#dbe5e8] bg-[#f7fbfc] p-3">
              <p className="text-2xl font-black text-[#008ca6]">{unreadCount}</p>
              <p className="text-xs font-black uppercase text-[#657176]">Unread</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="mt-5 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative min-w-0">
            <span className="sr-only">Search conversations</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, roles, or messages"
              className="field rounded-md !pl-11 !pr-4 text-sm placeholder:font-normal"
            />
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-[#f3f7f8] p-1">
            {[
              ['ALL', `All ${conversations.length}`],
              ['UNREAD', `Unread ${unreadCount}`],
              ['ACTIVE', `Active ${activeCount}`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as InboxFilter)}
                className={`min-h-10 rounded px-3 text-sm font-black transition ${
                  filter === value
                    ? 'bg-white text-[#07111f] shadow-sm'
                    : 'text-[#657176] hover:text-[#008ca6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
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
        ) : !error && filtered.length === 0 ? (
          <EmptyState
            title="No matching conversations"
            message="Try a different search term or switch back to all messages."
          />
        ) : (
          filtered.map((conversation) => {
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
                className={`group grid gap-3 rounded-md border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#008ca6] hover:shadow-md sm:grid-cols-[52px_1fr_auto] sm:gap-4 sm:p-5 ${
                  unread ? 'border-[#00a8c6]' : 'border-[#d7e2e6]'
                }`}
              >
                <span className="flex size-12 items-center justify-center rounded-md bg-[#07111f] text-sm font-black text-[#7fd0c7]">
                  {getInitials(otherName)}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 pr-2">
                    <strong className="truncate text-base sm:text-lg">
                      {otherName}
                    </strong>
                    {unread && (
                      <span className="rounded-full bg-[#e7ad2d] px-2 py-0.5 text-[10px] font-black uppercase text-[#07111f]">
                        New
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-sm font-bold text-[#51656e]">
                    {conversation.auditionTitleSnapshot}
                  </span>
                  <span className="mt-2 block truncate text-sm text-[#68777e]">
                    {conversation.lastMessageText || 'Conversation ready'}
                  </span>
                </span>
                <span className="flex items-start justify-between gap-2 text-xs font-bold text-[#7b898f] sm:block sm:text-right">
                  <span>{formatTime(conversation.updatedAt)}</span>
                  <MessageSquare
                    aria-hidden="true"
                    className="size-4 text-[#a6b5bb] transition group-hover:text-[#008ca6] sm:ml-auto sm:mt-3"
                  />
                </span>
              </Link>
            );
          })
        )}
        </div>

        <aside className="hidden h-fit rounded-md border border-[#cbd6db] bg-[#07111f] p-5 text-white shadow-sm xl:block">
          <div className="flex size-12 items-center justify-center rounded-md bg-white/10 text-[#7fd0c7]">
            <Inbox aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-5 text-2xl font-black">Your casting inbox</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Keep audition questions, self-tape guidance, and recruiter follow-ups
            inside Nata Connect for a safer record of every conversation.
          </p>
          <div className="mt-5 space-y-3 rounded-md border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-black text-[#ffd66d]">Inbox habits</p>
            <p className="text-white/70">Reply while roles are active.</p>
            <p className="text-white/70">Avoid sharing personal contact details early.</p>
            <p className="text-white/70">Report anything that feels unsafe.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
