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
  emailVerified?: boolean;
};

const statusTone = (status?: string, emailVerified?: boolean): AdminStatusTone =>
  status === 'SUSPENDED'
    ? 'danger'
    : emailVerified === false
      ? 'attention'
      : 'success';

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
          <div className="mt-5 hidden grid-cols-1 gap-3 lg:grid">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="surface flex flex-wrap items-center justify-between gap-4 rounded-md p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-black">{item.email || 'No email'}</p>
                  <p className="mt-1 break-all text-xs text-[#7a878d]">{item.id}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase text-[#657176]">
                    {item.userType || 'Unknown'}
                  </span>
                  {item.emailVerified === false && (
                    <AdminStatusBadge tone="attention">Email unverified</AdminStatusBadge>
                  )}
                  <AdminStatusBadge tone={statusTone(item.accountStatus, item.emailVerified)}>
                    {item.accountStatus || 'ACTIVE'}
                  </AdminStatusBadge>
                  <UserActions item={item} onComplete={load} />
                </div>
              </article>
            ))}
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
        <div className="flex flex-wrap items-center gap-2">
          {item.emailVerified === false && (
            <AdminStatusBadge tone="attention">Email unverified</AdminStatusBadge>
          )}
          <AdminStatusBadge tone={statusTone(item.accountStatus, item.emailVerified)}>
            {item.accountStatus || 'ACTIVE'}
          </AdminStatusBadge>
        </div>
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
