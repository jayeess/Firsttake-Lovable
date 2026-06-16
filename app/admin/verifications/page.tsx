'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminActionButton } from '@/components/admin-action-button';
import { fetchAdminData } from '@/app/lib/admin-client';
import type { RecruiterVerification } from '@/app/lib/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import {
  AdminActionGroup,
  AdminDangerActionGroup,
  AdminInfo,
  AdminPageHeader,
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';

type Item = RecruiterVerification & { id: string };

const statusTone = (status: string): AdminStatusTone =>
  status === 'pending'
    ? 'attention'
    : status === 'approved'
      ? 'success'
      : status === 'suspended'
        ? 'danger'
        : 'muted';

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    void fetchAdminData<{ verifications: Item[] }>('verifications')
      .then((data) => setItems(data.verifications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Recruiter trust"
        title="Recruiter verification queue"
        description="Approve only organisations with credible, consistent production details. Pending submissions should be reviewed before audition publishing."
      />
      {error && (
        <ErrorState
          title="Verification queue could not be loaded"
          message={error}
          onRetry={() => {
            setLoading(true);
            setError('');
            load();
          }}
        />
      )}
      <div className="mt-7 grid gap-4">
        {loading && <LoadingState label="Loading recruiter verification requests..." />}
        {items.map((item) => (
          <article
            key={item.id}
            className={`surface rounded-md p-5 sm:p-6 ${
              item.status === 'pending' ? 'border-[#e7ad2d]' : ''
            }`}
          >
            <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
              <div>
                <AdminStatusBadge tone={statusTone(item.status)}>
                  {item.status}
                </AdminStatusBadge>
                <h2 className="mt-3 text-2xl font-black">{item.legalName}</h2>
                <p className="mt-1 text-sm text-[#657176]">
                  {item.recruiterEmail}
                </p>
              </div>
              <div className="grid gap-3">
                <AdminActionGroup>
                  <AdminActionButton
                    action="approve_recruiter"
                    targetId={item.id}
                    label="Approve"
                    onComplete={load}
                  />
                  <AdminActionButton
                    action="reject_recruiter"
                    targetId={item.id}
                    label="Reject"
                    tone="secondary"
                    onComplete={load}
                  />
                </AdminActionGroup>
                <AdminDangerActionGroup>
                  {item.status === 'suspended' ? (
                    <AdminActionButton
                      action="restore_recruiter"
                      targetId={item.id}
                      label="Restore"
                      tone="secondary"
                      onComplete={load}
                    />
                  ) : (
                    <AdminActionButton
                      action="suspend_recruiter"
                      targetId={item.id}
                      label="Suspend"
                      tone="danger"
                      onComplete={load}
                    />
                  )}
                </AdminDangerActionGroup>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#e0e6e9] pt-5 sm:grid-cols-2">
              <AdminInfo
                label="Contact"
                value={`${item.contactPerson} / ${item.phone}`}
              />
              <AdminInfo label="Business type" value={item.businessType} />
              <AdminInfo label="Website" value={item.website || 'Not provided'} />
              <AdminInfo
                label="Social proof"
                value={item.socialProofUrl || 'Not provided'}
              />
            </dl>
            <section className="mt-5 rounded-md border border-[#d7e0e4] bg-[#f8fbfc] p-4">
              <p className="text-xs font-black uppercase text-[#657176]">
                Work description
              </p>
              <p className="mt-2 leading-7 text-[#526874]">
                {item.workDescription}
              </p>
            </section>
            {item.verificationNotes && (
              <p className="mt-3 text-sm text-[#657176]">
                Recruiter note: {item.verificationNotes}
              </p>
            )}
            {item.adminNote && (
              <p className="mt-3 border-l-2 border-[#e7ad2d] pl-3 text-sm">
                Admin note: {item.adminNote}
              </p>
            )}
          </article>
        ))}
        {!loading && items.length === 0 && !error && (
          <EmptyState
            title="No verification requests"
            message="New recruiter submissions will appear here for review."
          />
        )}
      </div>
    </AdminShell>
  );
}
