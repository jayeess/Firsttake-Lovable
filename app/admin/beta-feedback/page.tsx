'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminActionGroup,
  AdminInfo,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

type FeedbackRow = {
  id: string;
  userId?: string | null;
  role?: string | null;
  type?: string | null;
  rating?: number | null;
  message?: string | null;
  route?: string | null;
  contactEmail?: string | null;
  status?: string | null;
  createdAt?: unknown;
};

const statusTone = (status?: string | null): AdminStatusTone =>
  status === 'resolved'
    ? 'success'
    : status === 'reviewed'
      ? 'attention'
      : 'neutral';

export default function AdminBetaFeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminData<{ feedback: FeedbackRow[] }>('betaFeedback')
      .then((data) => setItems(data.feedback))
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Beta feedback could not be loaded.'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((item) => !status || (item.status ?? 'new') === status),
    [items, status]
  );
  const newCount = items.filter((item) => (item.status ?? 'new') === 'new')
    .length;
  const safetyCount = items.filter((item) => item.type === 'safety').length;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Beta learning loop"
        title="Beta feedback"
        description="Review bugs, confusion points, feature requests, safety signals, and general beta notes without exposing feedback publicly."
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Total feedback" value={items.length} />
        <AdminMetricCard
          label="New"
          value={newCount}
          tone={newCount > 0 ? 'attention' : 'success'}
          detail="Needs triage"
        />
        <AdminMetricCard
          label="Safety"
          value={safetyCount}
          tone={safetyCount > 0 ? 'danger' : 'success'}
          detail="Review first"
        />
      </section>

      <div className="surface mt-6 rounded-md p-4">
        <label className="text-xs font-black uppercase text-[#5c6c73]">
          Filter by status
          <select
            className="field mt-2 max-w-sm normal-case"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All feedback</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>

      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, check admin access and network status."
          onRetry={() => {
            setError('');
            load();
          }}
        />
      )}

      {loading ? (
        <LoadingState label="Loading beta feedback..." />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="No beta feedback matches this filter"
          message="New beta submissions will appear here for admin review."
        />
      ) : !error ? (
        <div className="mt-6 grid gap-4">
          {filtered.map((item) => (
            <article key={item.id} className="surface rounded-md p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <AdminStatusBadge tone={statusTone(item.status)}>
                      {item.status ?? 'new'}
                    </AdminStatusBadge>
                    <AdminStatusBadge
                      tone={item.type === 'safety' ? 'danger' : 'neutral'}
                    >
                      {item.type ?? 'general'}
                    </AdminStatusBadge>
                    {item.rating && (
                      <AdminStatusBadge tone="muted">
                        {item.rating}/5
                      </AdminStatusBadge>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap leading-7 text-[#3d5560]">
                    {item.message || 'No message supplied'}
                  </p>
                  <dl className="mt-5 grid gap-4 border-t border-[#e0e6e9] pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <AdminInfo label="Role" value={item.role ?? 'anonymous'} />
                    <AdminInfo label="Route" value={item.route || 'Not supplied'} />
                    <AdminInfo label="User" value={item.userId || 'Anonymous'} />
                    <AdminInfo
                      label="Contact"
                      value={item.contactEmail || 'Not supplied'}
                    />
                  </dl>
                </div>
                {item.status !== 'resolved' && (
                  <AdminActionGroup title="Feedback workflow">
                    {item.status !== 'reviewed' && (
                      <AdminActionButton
                        action="mark_beta_feedback_reviewed"
                        targetId={item.id}
                        label="Mark reviewed"
                        tone="secondary"
                        onComplete={load}
                      />
                    )}
                    <AdminActionButton
                      action="mark_beta_feedback_resolved"
                      targetId={item.id}
                      label="Mark resolved"
                      onComplete={load}
                    />
                  </AdminActionGroup>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
