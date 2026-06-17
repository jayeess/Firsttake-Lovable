'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminActionGroup,
  AdminDangerActionGroup,
  AdminInfo,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

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

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Casting quality"
        title="Audition moderation"
        description="Review active casting calls, remove unsafe or low-trust posts, and restore only after the recruiter fixes the concern."
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Total auditions" value={items.length} />
        <AdminMetricCard
          label="Visible"
          value={visibleCount}
          tone="success"
          detail="Available to Talent"
        />
        <AdminMetricCard
          label="Removed"
          value={removedCount}
          tone={removedCount > 0 ? 'danger' : 'success'}
          detail="Hidden from marketplace"
        />
      </section>
      <div className="surface mt-6 rounded-md p-4">
        <input
          className="field max-w-xl"
          placeholder="Search title, company, or location"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && (
        <ErrorState
          title="Auditions could not be loaded"
          message={error}
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
          message="Clear the search to review all casting calls."
        />
      ) : !error ? (
        <div className="mt-6 grid gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="surface grid gap-5 rounded-md p-5 lg:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <AdminStatusBadge>{item.status || 'UNKNOWN'}</AdminStatusBadge>
                  <AdminStatusBadge tone={moderationTone(item.moderationStatus)}>
                    {item.moderationStatus || 'VISIBLE'}
                  </AdminStatusBadge>
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
                <AdminActionGroup title="Restoration">
                  <AdminActionButton
                    action="restore_audition"
                    targetId={item.id}
                    label="Restore"
                    tone="secondary"
                    onComplete={load}
                  />
                </AdminActionGroup>
              ) : (
                <AdminDangerActionGroup title="Casting enforcement">
                  <AdminActionButton
                    action="remove_audition"
                    targetId={item.id}
                    label="Remove"
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
