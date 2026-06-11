'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAdminData } from '@/app/lib/admin-client';
import { AdminActionButton } from '@/components/admin-action-button';
import { AdminShell } from '@/components/admin-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';

type AuditionRow = {
  id: string;
  title?: string;
  recruiterName?: string;
  location?: string;
  status?: string;
  moderationStatus?: string;
};

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

  return (
    <AdminShell>
      <p className="eyebrow">Casting quality</p>
      <h1 className="mt-2 text-4xl font-black">Audition moderation</h1>
      <input
        className="field mt-6 max-w-xl"
        placeholder="Search title, company, or location"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

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
              className="surface flex flex-wrap items-center justify-between gap-5 p-5"
            >
              <div>
                <p className="text-xs font-black uppercase text-[#008ca6]">
                  {item.status} / {item.moderationStatus || 'VISIBLE'}
                </p>
                <h2 className="mt-2 text-xl font-black">{item.title}</h2>
                <p className="mt-1 text-sm text-[#657176]">
                  {item.recruiterName} / {item.location}
                </p>
              </div>
              {item.moderationStatus === 'REMOVED' ? (
                <AdminActionButton
                  action="restore_audition"
                  targetId={item.id}
                  label="Restore"
                  tone="secondary"
                  onComplete={load}
                />
              ) : (
                <AdminActionButton
                  action="remove_audition"
                  targetId={item.id}
                  label="Remove"
                  tone="danger"
                  onComplete={load}
                />
              )}
            </article>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
