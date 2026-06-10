'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminActionButton } from '@/components/admin-action-button';
import { fetchAdminData } from '@/app/lib/admin-client';

type UserRow = {
  id: string;
  email?: string;
  userType?: string;
  accountStatus?: string;
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => {
    void fetchAdminData<{ users: UserRow[] }>('users')
      .then((data) => setItems(data.users))
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!role || item.userType === role) &&
          (!search ||
            item.email?.toLowerCase().includes(search.toLowerCase()) ||
            item.id.toLowerCase().includes(search.toLowerCase()))
      ),
    [items, role, search]
  );

  return (
    <AdminShell>
      <p className="eyebrow">Account safety</p>
      <h1 className="mt-2 text-4xl font-black">User management</h1>
      <div className="surface mt-6 grid gap-3 p-4 sm:grid-cols-2">
        <input className="field" placeholder="Search email or UID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option><option value="TALENT">Talent</option><option value="RECRUITER">Recruiter</option>
        </select>
      </div>
      {error && <p className="mt-5 text-red-700">{error}</p>}
      <div className="surface mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#e8eff2] text-xs uppercase text-[#657176]"><tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-[#e0e6e9]"><td className="p-4"><p className="font-bold">{item.email || 'No email'}</p><p className="mt-1 text-xs text-[#7a878d]">{item.id}</p></td><td className="p-4">{item.userType || 'Unknown'}</td><td className="p-4 font-bold">{item.accountStatus || 'ACTIVE'}</td><td className="p-4">{item.accountStatus === 'SUSPENDED' ? <AdminActionButton action="restore_user" targetId={item.id} label="Restore" tone="secondary" onComplete={load} /> : <AdminActionButton action="suspend_user" targetId={item.id} label="Suspend" tone="danger" onComplete={load} />}</td></tr>)}</tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-[#657176]">No users match these filters.</p>}
      </div>
    </AdminShell>
  );
}
