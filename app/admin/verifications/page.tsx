'use client';

import { Building2, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
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
  AdminStatusBadge,
  type AdminStatusTone,
} from '@/components/admin-ui';
import {
  MetricCard,
  SafetyNotice,
  WorkspaceHero,
} from '@/components/product-ui';

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
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const approvedCount = items.filter((item) => item.status === 'approved').length;
  const suspendedCount = items.filter((item) => item.status === 'suspended').length;

  return (
    <AdminShell>
      <WorkspaceHero
        eyebrow="Recruiter trust"
        title="Recruiter verification queue"
        description="Approve only organisations with credible, consistent production details. Pending submissions should be reviewed before audition publishing."
        secondaryHref="/admin/audit-logs"
        secondaryLabel="Review audit history"
      />
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Pending review"
          value={pendingCount}
          detail="Needs admin decision"
          icon={UserCheck}
          tone={pendingCount > 0 ? 'attention' : 'success'}
        />
        <MetricCard
          label="Approved recruiters"
          value={approvedCount}
          detail="Eligible to publish"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Suspended"
          value={suspendedCount}
          detail="Publishing restricted"
          icon={ShieldAlert}
          tone={suspendedCount > 0 ? 'danger' : 'success'}
        />
      </section>
      <div className="mt-5">
        <SafetyNotice title="Verification purpose" icon={Building2}>
          Confirm company identity, production context, and public proof before
          enabling audition publishing. Reject unclear submissions with a useful
          note; suspend only when risk requires enforcement.
        </SafetyNotice>
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
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657176]">
                  Review whether this organisation can safely publish casting
                  calls and contact Talent through FirstTake.
                </p>
              </div>
              <div className="grid gap-3">
                <AdminActionGroup title="Verification decision">
                  <AdminActionButton
                    action="approve_recruiter"
                    targetId={item.id}
                    label="Approve recruiter"
                    onComplete={load}
                  />
                  <AdminActionButton
                    action="reject_recruiter"
                    targetId={item.id}
                    label="Reject with note"
                    tone="secondary"
                    onComplete={load}
                  />
                </AdminActionGroup>
                <AdminDangerActionGroup title="Account safety">
                  {item.status === 'suspended' ? (
                    <AdminActionButton
                      action="restore_recruiter"
                      targetId={item.id}
                      label="Restore recruiter"
                      tone="secondary"
                      onComplete={load}
                    />
                  ) : (
                    <AdminActionButton
                      action="suspend_recruiter"
                      targetId={item.id}
                      label="Suspend recruiter"
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
            message="New recruiter submissions will appear here with company identity, contact, website, and production context."
          />
        )}
      </div>
    </AdminShell>
  );
}
