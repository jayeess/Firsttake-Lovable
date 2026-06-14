'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import type { Conversation } from '@/app/lib/types';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';

export default function AdminMessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    void fetchAdminData<{ conversations: Conversation[] }>('conversations')
      .then((data) => setItems(data.conversations))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Conversation metadata could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <AdminShell>
      <p className="eyebrow">Communication safety</p>
      <h1 className="mt-2 text-4xl font-black">Conversation moderation</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657176]">
        Review application-linked conversation metadata and close unsafe
        threads. Message content remains participant-scoped unless a future
        report workflow explicitly escalates it.
      </p>

      {error && (
        <ErrorState
          title="Conversation metadata could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            load();
          }}
        />
      )}
      <div className="mt-7 space-y-3">
        {loading ? (
          <LoadingState label="Loading conversation metadata..." />
        ) : !error && items.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            message="Application-linked conversations will appear here."
          />
        ) : (
          items.map((conversation) => (
            <article key={conversation.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-[#008ca6]">
                    {conversation.status}
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    {conversation.auditionTitleSnapshot}
                  </h2>
                  <p className="mt-2 text-sm text-[#657176]">
                    {conversation.recruiterNameSnapshot} and{' '}
                    {conversation.talentNameSnapshot}
                  </p>
                  <p className="mt-2 text-xs text-[#7b898f]">
                    Conversation ID: {conversation.id}
                  </p>
                </div>
                {conversation.status === 'active' && (
                  <AdminActionButton
                    action="block_conversation"
                    targetId={conversation.id}
                    label="Block conversation"
                    tone="danger"
                    onComplete={load}
                  />
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </AdminShell>
  );
}
