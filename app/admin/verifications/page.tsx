'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminActionButton } from '@/components/admin-action-button';
import { fetchAdminData } from '@/app/lib/admin-client';
import type { RecruiterVerification } from '@/app/lib/types';

type Item = RecruiterVerification & { id: string };

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    void fetchAdminData<{ verifications: Item[] }>('verifications')
      .then((data) => setItems(data.verifications))
      .catch((err) => setError(err.message));
  }, []);
  useEffect(() => {
    void fetchAdminData<{ verifications: Item[] }>('verifications')
      .then((data) => setItems(data.verifications))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AdminShell>
      <p className="eyebrow">Recruiter trust</p>
      <h1 className="mt-2 text-4xl font-black">Verification queue</h1>
      <p className="mt-3 text-[#657176]">Approve only organisations with credible, consistent production details.</p>
      {error && <p className="mt-6 border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="mt-7 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[#008ca6]">{item.status}</p>
                <h2 className="mt-2 text-2xl font-black">{item.legalName}</h2>
                <p className="mt-1 text-sm text-[#657176]">{item.recruiterEmail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminActionButton action="approve_recruiter" targetId={item.id} label="Approve" onComplete={load} />
                <AdminActionButton action="reject_recruiter" targetId={item.id} label="Reject" tone="danger" onComplete={load} />
                {item.status === 'suspended' ? (
                  <AdminActionButton action="restore_recruiter" targetId={item.id} label="Restore" tone="secondary" onComplete={load} />
                ) : (
                  <AdminActionButton action="suspend_recruiter" targetId={item.id} label="Suspend" tone="danger" onComplete={load} />
                )}
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#e0e6e9] pt-5 sm:grid-cols-2">
              <Info label="Contact" value={`${item.contactPerson} · ${item.phone}`} />
              <Info label="Business type" value={item.businessType} />
              <Info label="Website" value={item.website || 'Not provided'} />
              <Info label="Social proof" value={item.socialProofUrl || 'Not provided'} />
            </dl>
            <p className="mt-5 leading-7 text-[#526874]">{item.workDescription}</p>
            {item.verificationNotes && <p className="mt-3 text-sm text-[#657176]">Recruiter note: {item.verificationNotes}</p>}
            {item.adminNote && <p className="mt-3 border-l-2 border-[#e7ad2d] pl-3 text-sm">Admin note: {item.adminNote}</p>}
          </article>
        ))}
        {items.length === 0 && !error && <p className="surface p-8 text-center text-[#657176]">No verification requests yet.</p>}
      </div>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-black uppercase text-[#7c8990]">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>;
}
