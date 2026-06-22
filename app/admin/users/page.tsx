'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminActionButton } from '@/components/admin-action-button';
import { fetchAdminData } from '@/app/lib/admin-client';
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

type UserRow = {
  id: string;
  email?: string;
  userType?: string;
  accountStatus?: string;
};

const statusTone = (status?: string): AdminStatusTone =>
  status === 'SUSPENDED' ? 'danger' : 'success';

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    void fetchAdminData<{ users: UserRow[] }>('users')
      .then((data) => setItems(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
  const suspendedCount = items.filter(
    (item) => item.accountStatus === 'SUSPENDED'
  ).length;
  const talentCount = items.filter((item) => item.userType === 'TALENT').length;
  const recruiterCount = items.filter(
    (item) => item.userType === 'RECRUITER'
  ).length;

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Account safety"
        title="User management"
        description="Search accounts, review role state, and suspend or restore users when trust and safety requires intervention."
      />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total users" value={items.length} />
        <AdminMetricCard
          label="Talent"
          value={talentCount}
          tone="success"
          detail="Registered profiles"
        />
        <AdminMetricCard
          label="Recruiters"
          value={recruiterCount}
          tone="neutral"
          detail="Casting accounts"
        />
        <AdminMetricCard
          label="Suspended"
          value={suspendedCount}
          tone={suspendedCount > 0 ? 'danger' : 'success'}
          detail="Needs review"
        />
      </section>
      <div className="surface mt-6 grid gap-3 rounded-md p-4 sm:grid-cols-2">
        <input
          className="field"
          placeholder="Search email or UID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="field"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">All roles</option>
          <option value="TALENT">Talent</option>
          <option value="RECRUITER">Recruiter</option>
        </select>
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
      {loading && <LoadingState label="Loading account records..." />}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="No users match these filters"
          message="Clear the search or role filter to review all accounts."
        />
      ) : !loading && !error ? (
        <>
          <div className="mt-5 grid gap-4 lg:hidden">
            {filtered.map((item) => (
              <UserCard key={item.id} item={item} onComplete={load} />
            ))}
          </div>
          <div className="surface mt-5 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#e8eff2] text-xs uppercase text-[#657176]">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[#e0e6e9]">
                    <td className="p-4">
                      <p className="font-bold">{item.email || 'No email'}</p>
                      <p className="mt-1 max-w-md break-all text-xs text-[#7a878d]">
                        {item.id}
                      </p>
                    </td>
                    <td className="p-4">{item.userType || 'Unknown'}</td>
                    <td className="p-4">
                      <AdminStatusBadge tone={statusTone(item.accountStatus)}>
                        {item.accountStatus || 'ACTIVE'}
                      </AdminStatusBadge>
                    </td>
                    <td className="p-4">
                      <UserActions item={item} onComplete={load} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}

function UserCard({
  item,
  onComplete,
}: {
  item: UserRow;
  onComplete: () => void;
}) {
  return (
    <article className="surface rounded-md p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{item.email || 'No email'}</p>
          <p className="mt-1 break-all text-xs text-[#7a878d]">{item.id}</p>
        </div>
        <AdminStatusBadge tone={statusTone(item.accountStatus)}>
          {item.accountStatus || 'ACTIVE'}
        </AdminStatusBadge>
      </div>
      <dl className="mt-4">
        <AdminInfo label="Role" value={item.userType || 'Unknown'} />
      </dl>
      <div className="mt-4">
        <UserActions item={item} onComplete={onComplete} />
      </div>
    </article>
  );
}

function UserActions({
  item,
  onComplete,
}: {
  item: UserRow;
  onComplete: () => void;
}) {
  return item.accountStatus === 'SUSPENDED' ? (
    <AdminActionGroup title="Account recovery">
      <AdminActionButton
        action="restore_user"
        targetId={item.id}
        label="Restore"
        tone="secondary"
        onComplete={onComplete}
      />
    </AdminActionGroup>
  ) : (
    <AdminDangerActionGroup title="Account enforcement">
      <AdminActionButton
        action="suspend_user"
        targetId={item.id}
        label="Suspend"
        tone="danger"
        onComplete={onComplete}
      />
    </AdminDangerActionGroup>
  );
}
