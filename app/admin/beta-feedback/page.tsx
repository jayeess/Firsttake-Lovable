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
import type { BetaFeedbackSeverity } from '@/app/lib/beta-feedback-policy';

type FeedbackRow = {
  id: string;
  userId?: string | null;
  role?: string | null;
  type?: string | null;
  severity?: BetaFeedbackSeverity | null;
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

const severityTone = (severity?: BetaFeedbackSeverity | null): AdminStatusTone =>
  severity === 'blocking'
    ? 'danger'
    : severity === 'high'
      ? 'attention'
      : severity === 'medium'
        ? 'neutral'
        : 'muted';

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  confusion: 'Confusing flow',
  feature_request: 'Feature request',
  performance: 'Performance',
  safety: 'Safety concern',
  general: 'General',
};

export default function AdminBetaFeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
      items.filter(
        (item) =>
          (!statusFilter || (item.status ?? 'new') === statusFilter) &&
          (!typeFilter || (item.type ?? 'general') === typeFilter)
      ),
    [items, statusFilter, typeFilter]
  );

  const newCount = items.filter((item) => (item.status ?? 'new') === 'new').length;
  const safetyCount = items.filter((item) => item.type === 'safety').length;
  const blockingCount = items.filter((item) => item.severity === 'blocking').length;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Beta learning loop"
        title="Beta feedback"
        description="Review bugs, confusing flows, performance signals, feature requests, and safety concerns. Blocking and high-severity items appear first."
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Total feedback" value={items.length} />
        <AdminMetricCard
          label="New"
          value={newCount}
          tone={newCount > 0 ? 'attention' : 'success'}
          detail="Needs triage"
        />
        <AdminMetricCard
          label="Blocking"
          value={blockingCount}
          tone={blockingCount > 0 ? 'danger' : 'success'}
          detail="Cannot continue"
        />
        <AdminMetricCard
          label="Safety"
          value={safetyCount}
          tone={safetyCount > 0 ? 'danger' : 'success'}
          detail="Review first"
        />
      </section>

      <div className="surface mt-6 rounded-md p-4">
        <div className="flex flex-wrap gap-4">
          <label className="text-xs font-black uppercase text-[#5c6c73]">
            Status
            <select
              className="field mt-2 max-w-xs normal-case"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="text-xs font-black uppercase text-[#5c6c73]">
            Type
            <select
              className="field mt-2 max-w-xs normal-case"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
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
          {filtered
            .slice()
            .sort((a, b) => {
              const order = { blocking: 0, high: 1, medium: 2, low: 3 };
              return (
                (order[a.severity ?? 'medium'] ?? 2) -
                (order[b.severity ?? 'medium'] ?? 2)
              );
            })
            .map((item) => (
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
                        {TYPE_LABELS[item.type ?? ''] ?? item.type ?? 'general'}
                      </AdminStatusBadge>
                      {item.severity && (
                        <AdminStatusBadge tone={severityTone(item.severity)}>
                          {item.severity}
                        </AdminStatusBadge>
                      )}
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
