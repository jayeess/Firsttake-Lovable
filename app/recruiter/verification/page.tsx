'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  getRecruiterProfile,
  getRecruiterVerification,
  submitRecruiterVerification,
} from '@/app/lib/firestore-service';
import type { RecruiterVerification } from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';
import { ErrorState, LoadingState } from '@/components/async-state';

type FormData = Pick<
  RecruiterVerification,
  | 'legalName'
  | 'contactPerson'
  | 'phone'
  | 'website'
  | 'socialProofUrl'
  | 'businessType'
  | 'workDescription'
  | 'verificationNotes'
>;

const emptyForm: FormData = {
  legalName: '',
  contactPerson: '',
  phone: '',
  website: '',
  socialProofUrl: '',
  businessType: '',
  workDescription: '',
  verificationNotes: '',
};

export default function RecruiterVerificationPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [verification, setVerification] =
    useState<RecruiterVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getRecruiterProfile(user.uid),
      getRecruiterVerification(user.uid),
    ])
      .then(([profile, existing]) => {
        setVerification(existing);
        setForm({
          ...emptyForm,
          legalName: existing?.legalName ?? profile?.companyName ?? '',
          phone: existing?.phone ?? profile?.phone ?? '',
          website: existing?.website ?? profile?.website ?? '',
          contactPerson: existing?.contactPerson ?? '',
          socialProofUrl: existing?.socialProofUrl ?? '',
          businessType: existing?.businessType ?? '',
          workDescription: existing?.workDescription ?? profile?.bio ?? '',
          verificationNotes: existing?.verificationNotes ?? '',
        });
      })
      .catch((err) => setError(getErrorMessage(err, 'Unable to load verification')))
      .finally(() => setLoading(false));
  }, [reloadKey, user]);

  const canSubmit =
    !verification ||
    verification.status === 'not_submitted' ||
    verification.status === 'rejected';

  const update = (key: keyof FormData, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !canSubmit) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await submitRecruiterVerification(user.uid, user.email, form);
      const updated = await getRecruiterVerification(user.uid);
      setVerification(updated);
      setMessage('Verification submitted for private-beta admin review.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to submit verification'));
    } finally {
      setSaving(false);
    }
  };

  const status = verification?.status ?? 'not_submitted';

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="max-w-4xl">
        <p className="eyebrow">Recruiter trust</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">Private-beta verification</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
              Tell the review team who you are, what you produce, and where your
              professional work can be verified.
            </p>
          </div>
          <span className="border border-[#b9cdd4] bg-white px-4 py-2 text-sm font-black uppercase text-[#008ca6]">
            {status.replace('_', ' ')}
          </span>
        </div>

        {loading ? <LoadingState label="Loading verification status..." /> : null}
        {error && (
          <ErrorState
            title="Verification details could not be loaded"
            message="We could not load this section. Try refreshing the page."
            onRetry={() => {
              setLoading(true);
              setError('');
              setReloadKey((current) => current + 1);
            }}
          />
        )}
        {message && <p className="mt-6 border border-green-300 bg-green-50 p-4 text-green-800">{message}</p>}
        {verification?.adminNote && (
          <div className="mt-6 border-l-4 border-[#e7ad2d] bg-[#fff8e8] p-4">
            <p className="font-black">Review note</p>
            <p className="mt-2 text-sm leading-6">{verification.adminNote}</p>
          </div>
        )}

        <form onSubmit={submit} className="surface mt-7 grid gap-5 p-6 sm:grid-cols-2">
          <Field label="Legal/company name" value={form.legalName} onChange={(value) => update('legalName', value)} disabled={!canSubmit} />
          <Field label="Contact person" value={form.contactPerson} onChange={(value) => update('contactPerson', value)} disabled={!canSubmit} />
          <Field label="Phone" value={form.phone} onChange={(value) => update('phone', value)} disabled={!canSubmit} />
          <Field label="Business type" value={form.businessType} onChange={(value) => update('businessType', value)} disabled={!canSubmit} placeholder="Studio, agency, production house..." />
          <Field label="Website" value={form.website ?? ''} onChange={(value) => update('website', value)} disabled={!canSubmit} required={false} type="url" />
          <Field label="Social proof link" value={form.socialProofUrl ?? ''} onChange={(value) => update('socialProofUrl', value)} disabled={!canSubmit} required={false} type="url" />
          <label className="block text-sm font-bold sm:col-span-2">
            Work and production description
            <textarea className="field mt-2" rows={6} required disabled={!canSubmit} value={form.workDescription} onChange={(e) => update('workDescription', e.target.value)} />
          </label>
          <label className="block text-sm font-bold sm:col-span-2">
            Notes for the verification team
            <textarea className="field mt-2" rows={4} disabled={!canSubmit} value={form.verificationNotes ?? ''} onChange={(e) => update('verificationNotes', e.target.value)} />
          </label>
          <section className="border border-dashed border-[#9fb6bf] bg-[#f2f7f9] p-5 sm:col-span-2">
            <p className="font-black">Verification documents</p>
            <p className="mt-2 text-sm leading-6 text-[#657176]">
              Document uploads are coming soon. For beta verification, submit
              your company details, website, social proof links, and production
              context here.
            </p>
            <button type="button" disabled className="secondary-button mt-4 opacity-45">
              Document upload coming soon
            </button>
          </section>
          {canSubmit && (
            <button disabled={saving} className="primary-button sm:col-span-2 sm:w-fit disabled:opacity-50">
              {saving ? 'Submitting...' : status === 'rejected' ? 'Resubmit verification' : 'Submit for review'}
            </button>
          )}
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange, disabled, required = true, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; required?: boolean; type?: string; placeholder?: string }) {
  return <label className="block text-sm font-bold">{label}<input className="field mt-2" type={type} required={required} disabled={disabled} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}
