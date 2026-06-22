'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  EyeOff,
  FileText,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminActionGroup,
  AdminDangerActionGroup,
  AdminInfo,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';
import {
  MetricCard,
  SafetyNotice,
  SectionHeader,
  WorkspaceHero,
} from '@/components/product-ui';

type AuditionRow = {
  id: string;
  title?: string;
  recruiterName?: string;
  location?: string;
  status?: string;
  moderationStatus?: string;
  selfTapeEnabled?: boolean;
  selfTapeRequired?: boolean;
};

const moderationTone = (status?: string): AdminStatusTone =>
  status === 'REMOVED' ? 'danger' : 'success';

export default function AdminAuditionsPage() {
  const [items, setItems] = useState<AuditionRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void fetchAdminData<{ auditions: AuditionRow[] }>('auditions')
      .then((data) => setItems(data.auditions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          !search ||
          [item.title, item.recruiterName, item.location].some((value) =>
            value?.toLowerCase().includes(search.toLowerCase())
          )
      ),
    [items, search]
  );
  const removedCount = items.filter(
    (item) => item.moderationStatus === 'REMOVED'
  ).length;
  const visibleCount = items.length - removedCount;
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const closedCount = items.filter((item) => item.status === 'CLOSED').length;
  const draftCount = items.filter((item) => item.status === 'DRAFT').length;

  return (
    <AdminShell>
      <WorkspaceHero
        eyebrow="Audition moderation"
        title="Keep the marketplace credible."
        description="Review casting calls, distinguish visible and removed briefs, and act only when a post is unsafe, misleading, or no longer appropriate."
        secondaryHref="/admin/reports"
        secondaryLabel="Open reports"
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active auditions"
          value={activeCount}
          tone="success"
          detail="Open casting calls"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Visible briefs"
          value={visibleCount}
          tone="success"
          detail="Available to Talent"
          icon={FileText}
        />
        <MetricCard
          label="Closed or draft"
          value={closedCount + draftCount}
          tone={closedCount + draftCount > 0 ? 'attention' : 'neutral'}
          detail="Not actively casting"
          icon={Clock3}
        />
        <MetricCard
          label="Removed briefs"
          value={removedCount}
          tone={removedCount > 0 ? 'danger' : 'success'}
          detail="Hidden from marketplace"
          icon={EyeOff}
        />
      </section>
      <div className="mt-5">
        <SafetyNotice title="Moderation standard" icon={ShieldAlert}>
          Remove casting calls only when they are unsafe, misleading, abusive,
          or inconsistent with platform rules. Restored auditions should be
          ready for Talent to review with confidence.
        </SafetyNotice>
      </div>
      <div className="surface mt-6 rounded-md p-4">
        <SectionHeader
          eyebrow="Review queue"
          title="Find casting calls"
          description="Search by role title, recruiter, or location before taking a moderation action."
        />
        <div className="relative mt-4 max-w-xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#657176]"
          />
          <input
            className="field w-full pl-10"
            placeholder="Search title, company, or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <ErrorState
          title="We could not load this section"
          message="Try refreshing the page. If it continues, check admin access and network status."
          onRetry={() => {
            setLoading(true);
            setError('');
            load();
          }}
        />
      )}
      {loading ? (
        <LoadingState label="Loading casting calls for moderation..." />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          title="No auditions match this search"
          message="Clear the search to review all casting calls, or return when new auditions are published."
        />
      ) : !error ? (
        <div className="mt-6 grid gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`surface grid gap-5 rounded-md p-5 lg:grid-cols-[1fr_auto] ${
                item.moderationStatus === 'REMOVED'
                  ? 'border-red-200 bg-red-50/40'
                  : item.status === 'CLOSED' || item.status === 'DRAFT'
                    ? 'border-[#e7d3a0] bg-[#fffaf0]'
                    : ''
              }`}
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <AdminStatusBadge>{item.status || 'UNKNOWN'}</AdminStatusBadge>
                  <AdminStatusBadge tone={moderationTone(item.moderationStatus)}>
                    {item.moderationStatus || 'VISIBLE'}
                  </AdminStatusBadge>
                  {item.status === 'CLOSED' && (
                    <AdminStatusBadge tone="muted">Closed</AdminStatusBadge>
                  )}
                  {item.selfTapeEnabled && (
                    <AdminStatusBadge tone="attention">
                      {item.selfTapeRequired
                        ? 'Self-tape required'
                        : 'Self-tape optional'}
                    </AdminStatusBadge>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-black">{item.title}</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <AdminInfo label="Recruiter" value={item.recruiterName} />
                  <AdminInfo label="Location" value={item.location} />
                </dl>
              </div>
              {item.moderationStatus === 'REMOVED' ? (
                <AdminActionGroup title="Restore marketplace visibility">
                  <AdminActionButton
                    action="restore_audition"
                    targetId={item.id}
                    label="Restore audition"
                    tone="secondary"
                    onComplete={load}
                  />
                </AdminActionGroup>
              ) : (
                <AdminDangerActionGroup title="Marketplace enforcement">
                  <AdminActionButton
                    action="remove_audition"
                    targetId={item.id}
                    label="Remove from marketplace"
                    tone="danger"
                    onComplete={load}
                  />
                </AdminDangerActionGroup>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
