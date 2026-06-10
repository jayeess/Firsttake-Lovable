'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminActionButton } from '@/components/admin-action-button';
import { fetchAdminData } from '@/app/lib/admin-client';

type AuditionRow = {
  id: string; title?: string; recruiterName?: string; location?: string;
  status?: string; moderationStatus?: string;
};

export default function AdminAuditionsPage() {
  const [items, setItems] = useState<AuditionRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => {
    void fetchAdminData<{ auditions: AuditionRow[] }>('auditions')
      .then((data) => setItems(data.auditions))
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);
  const filtered = useMemo(() => items.filter((item) => !search || [item.title, item.recruiterName, item.location].some((value) => value?.toLowerCase().includes(search.toLowerCase()))), [items, search]);
  return (
    <AdminShell>
      <p className="eyebrow">Casting quality</p><h1 className="mt-2 text-4xl font-black">Audition moderation</h1>
      <input className="field mt-6 max-w-xl" placeholder="Search title, company, or location" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error && <p className="mt-5 text-red-700">{error}</p>}
      <div className="mt-6 grid gap-4">{filtered.map((item) => <article key={item.id} className="surface flex flex-wrap items-center justify-between gap-5 p-5"><div><p className="text-xs font-black uppercase text-[#008ca6]">{item.status} · {item.moderationStatus || 'VISIBLE'}</p><h2 className="mt-2 text-xl font-black">{item.title}</h2><p className="mt-1 text-sm text-[#657176]">{item.recruiterName} · {item.location}</p></div>{item.moderationStatus === 'REMOVED' ? <AdminActionButton action="restore_audition" targetId={item.id} label="Restore" tone="secondary" onComplete={load} /> : <AdminActionButton action="remove_audition" targetId={item.id} label="Remove" tone="danger" onComplete={load} />}</article>)}
      {filtered.length === 0 && !error && <p className="surface p-8 text-center text-[#657176]">No auditions match the current search.</p>}</div>
    </AdminShell>
  );
}
