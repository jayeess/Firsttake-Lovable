'use client';

import { ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  getRecruiterProfile,
  getRecruiterVerification,
  submitRecruiterVerification,
} from '@/app/lib/firestore-service';
import type {
  RecruiterVerification,
  RecruiterVerificationEvidence,
} from '@/app/lib/types';
import { useAuth } from '@/context/auth-context';
import { getErrorMessage } from '@/app/lib/error-utils';
import { ErrorState, LoadingState } from '@/components/async-state';
import {
  deleteStoragePath,
  getStorageDownloadUrl,
  uploadRecruiterVerificationEvidence,
} from '@/app/lib/storage-service';
import {
  MAX_RECRUITER_EVIDENCE_COUNT,
  RECRUITER_EVIDENCE_MAX_BYTES,
} from '@/app/lib/upload-policy';

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState<RecruiterVerificationEvidence[]>([]);
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
        setEvidence(existing?.evidence ?? []);
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
      await submitRecruiterVerification(user.uid, user.email, {
        ...form,
        evidence,
      });
      const updated = await getRecruiterVerification(user.uid);
      setVerification(updated);
      setEvidence(updated?.evidence ?? evidence);
      setMessage('Verification submitted. The trust team will review your details and get back to you.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to submit verification'));
    } finally {
      setSaving(false);
    }
  };

  const status = verification?.status ?? 'not_submitted';
  const statusGuidance: Record<string, string> = {
    not_submitted:
      'Submit company details once your profile is complete. Verification comes before publishing live casting briefs.',
    pending:
      'Review is pending. Keep company details accurate; the team may request more context safely.',
    approved:
      'Approved accounts can publish casting briefs and show verified recruiter trust signals.',
    rejected:
      'Use the review note, update details, then resubmit for another trust review.',
    suspended:
      'Publishing access is paused. Contact the trust team before submitting new casting activity.',
  };

  const uploadEvidence = async (file?: File) => {
    if (!file || !user || !canSubmit) return;
    if (evidence.length >= MAX_RECRUITER_EVIDENCE_COUNT) {
      setError(`Upload ${MAX_RECRUITER_EVIDENCE_COUNT} verification files or fewer.`);
      return;
    }
    setError('');
    setMessage('');
    setUploading(true);
    setUploadProgress(0);
    let storagePath = '';
    try {
      const id = crypto.randomUUID();
      const result = await uploadRecruiterVerificationEvidence(
        user.uid,
        id,
        file,
        setUploadProgress
      );
      storagePath = result.storagePath;
      setEvidence((current) => [
        ...current,
        {
          id,
          fileName: result.fileName,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
          storagePath: result.storagePath,
          uploadedAt: new Date().toISOString(),
        },
      ]);
      setMessage('Evidence uploaded. Submit the verification form to send it for admin review.');
    } catch (uploadError: unknown) {
      await deleteStoragePath(storagePath);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Verification evidence upload failed.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const removeEvidence = async (item: RecruiterVerificationEvidence) => {
    if (!canSubmit) return;
    setError('');
    await deleteStoragePath(item.storagePath).catch(() => undefined);
    setEvidence((current) => current.filter((entry) => entry.id !== item.id));
  };

  const openEvidence = async (item: RecruiterVerificationEvidence) => {
    try {
      const url = await getStorageDownloadUrl(item.storagePath);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Evidence could not be opened. Refresh and try again.');
    }
  };

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="max-w-4xl">
        <p className="eyebrow">Recruiter trust</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Company verification</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
              Tell the review team who you are, what you produce, and where your
              professional work can be verified. Verified recruiters can publish casting briefs
              and build Talent trust with a verified badge on every listing.
            </p>
          </div>
          <span className="rounded-md border border-[#b9cdd4] bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#008ca6]">
            {status.replace('_', ' ')}
          </span>
        </div>
        <p className="mt-4 rounded-md border border-[#d7e3e7] bg-white p-4 text-sm font-bold leading-6 text-[#40535c]">
          {statusGuidance[status] ?? statusGuidance.not_submitted}
        </p>

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
        {message && <p className="mt-6 rounded-md border border-green-300 bg-green-50 p-4 text-green-800">{message}</p>}
        {verification?.adminNote && (
          <div className="mt-6 rounded-md border-l-4 border-[#e7ad2d] bg-[#fff8e8] p-4">
            <p className="font-black">Review note</p>
            <p className="mt-2 text-sm leading-6">{verification.adminNote}</p>
          </div>
        )}

        <form onSubmit={submit} className="surface mt-5 grid gap-5 p-5 sm:grid-cols-2">
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
              Upload optional proof such as business registration, production
              house proof, authorization letter, professional ID, project proof
              image, or PDF. Documents are reviewed only by Admin for
              verification and do not guarantee casting outcomes.
            </p>
            <p className="mt-4 rounded-md border border-[#bad7d3] bg-white p-3 text-sm font-bold leading-6 text-[#234b47]">
              Hide sensitive information that is not needed before upload.
              Never place private documents in public profile or audition
              fields.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold uppercase text-[#657176]">
                JPEG, PNG, WebP, or PDF / up to{' '}
                {Math.round(RECRUITER_EVIDENCE_MAX_BYTES / 1024 / 1024)} MB
              </div>
              {canSubmit && (
                <label className="secondary-button flex cursor-pointer items-center gap-2 sm:w-auto">
                  <Upload aria-hidden="true" size={17} />
                  Upload evidence
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(event) =>
                      void uploadEvidence(event.target.files?.[0])
                    }
                  />
                </label>
              )}
            </div>
            {uploadProgress !== null && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold">
                  <span>Uploading evidence</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#dbe4e8]">
                  <div
                    className="h-full rounded-full bg-[#008ca6]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {evidence.length > 0 && (
              <div className="mt-4 grid gap-3">
                {evidence.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-[#d7e2e6] bg-white p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-0.5 size-5 shrink-0 text-[#008ca6]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {item.fileName}
                          </p>
                          <p className="mt-1 text-xs font-bold uppercase text-[#657176]">
                            {item.mimeType} / {formatBytes(item.sizeBytes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void openEvidence(item)}
                          className="secondary-button min-h-10 px-3 text-xs sm:w-auto"
                        >
                          <ExternalLink aria-hidden="true" size={15} />
                          Open
                        </button>
                        {canSubmit && (
                          <button
                            type="button"
                            onClick={() => void removeEvidence(item)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-xs font-black text-red-700"
                          >
                            <Trash2 aria-hidden="true" size={15} />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
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

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}
