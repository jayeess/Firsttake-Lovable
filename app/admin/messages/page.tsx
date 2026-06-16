'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import type { Conversation } from '@/app/lib/types';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminDangerActionGroup,
  AdminInfo,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

const conversationTone = (status?: string): AdminStatusTone =>
  status === 'active' ? 'success' : status === 'blocked' ? 'danger' : 'muted';

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
  const activeCount = items.filter((item) => item.status === 'active').length;
  const blockedCount = items.filter((item) => item.status === 'blocked').length;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Communication safety"
        title="Conversation moderation"
        description="Review application-linked conversation metadata and close unsafe threads. Message content remains participant-scoped unless a report workflow explicitly escalates it."
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Conversations" value={items.length} />
        <AdminMetricCard
          label="Active"
          value={activeCount}
          tone="success"
          detail="Open participant threads"
        />
        <AdminMetricCard
          label="Blocked"
          value={blockedCount}
          tone={blockedCount > 0 ? 'danger' : 'success'}
          detail="Closed for safety"
        />
      </section>

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
            <article key={conversation.id} className="surface rounded-md p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <AdminStatusBadge tone={conversationTone(conversation.status)}>
                    {conversation.status}
                  </AdminStatusBadge>
                  <h2 className="mt-2 text-xl font-black">
                    {conversation.auditionTitleSnapshot}
                  </h2>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    <AdminInfo
                      label="Recruiter"
                      value={conversation.recruiterNameSnapshot}
                    />
                    <AdminInfo
                      label="Talent"
                      value={conversation.talentNameSnapshot}
                    />
                    <AdminInfo label="Conversation ID" value={conversation.id} />
                  </dl>
                </div>
                {conversation.status === 'active' && (
                  <AdminDangerActionGroup title="Conversation enforcement">
                    <AdminActionButton
                      action="block_conversation"
                      targetId={conversation.id}
                      label="Block conversation"
                      tone="danger"
                      onComplete={load}
                    />
                  </AdminDangerActionGroup>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </AdminShell>
  );
}
