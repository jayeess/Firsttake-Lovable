'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import {
  createAudition,
  ensureUserAccount,
  getRecruiterProfile,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type AuditionStatus,
  type ExperienceLevel,
  type TalentCategory,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

export default function NewAuditionPage() {
  const router = useRouter();
  const { user, userType } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'ACTOR' as TalentCategory,
    experienceLevel: 'FRESHER' as ExperienceLevel,
    location: '',
    duration: '',
    requirements: '',
    numberOfPositions: 1,
    payInfo: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const publish = async (status: Extract<AuditionStatus, 'ACTIVE' | 'DRAFT'>) => {
    if (!user) {
      setError('Please log in before posting an audition.');
      return;
    }
    if (userType !== 'RECRUITER') {
      setError('Only recruiter accounts can publish auditions.');
      return;
    }
    if (!form.deadline || new Date(form.deadline) <= new Date()) {
      setError('Choose a deadline in the future.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await ensureUserAccount(user.uid, user.email, 'RECRUITER');
      const profile = await getRecruiterProfile(user.uid).catch(() => null);
      await createAudition(user.uid, {
        ...form,
        recruiterName: profile?.companyName ?? user.email ?? 'Recruiter',
        deadline: new Date(form.deadline),
        status,
      });
      router.push('/recruiter/auditions');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save audition'));
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof typeof form, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <AppShell>
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase text-[#2e75b6]">Recruiter tools</p>
        <h1 className="mt-1 text-3xl font-bold">Post an audition</h1>
        {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); void publish('ACTIVE'); }} className="mt-6 grid gap-5 border border-[#d9dee5] bg-white p-6 sm:grid-cols-2">
          <Input label="Audition title" value={form.title} onChange={(v) => update('title', v)} />
          <label className="block text-sm font-semibold">Category<select value={form.category} onChange={(e) => update('category', e.target.value)} className="field mt-2">{Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="block text-sm font-semibold">Experience level<select value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value)} className="field mt-2">{Object.entries(EXPERIENCE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <Input label="Location" value={form.location} onChange={(v) => update('location', v)} />
          <Input label="Duration" value={form.duration} onChange={(v) => update('duration', v)} placeholder="e.g. 3 shooting days" />
          <Input label="Number of positions" type="number" value={String(form.numberOfPositions)} onChange={(v) => update('numberOfPositions', Number(v))} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={(v) => update('deadline', v)} />
          <Input label="Pay information" value={form.payInfo} onChange={(v) => update('payInfo', v)} required={false} />
          <label className="block text-sm font-semibold sm:col-span-2">Description<textarea required rows={6} value={form.description} onChange={(e) => update('description', e.target.value)} className="field mt-2 py-3" /></label>
          <label className="block text-sm font-semibold sm:col-span-2">Requirements<textarea required rows={5} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} className="field mt-2 py-3" /></label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="button" disabled={saving} onClick={() => void publish('DRAFT')} className="h-12 border border-[#9ba7b2] px-5 font-semibold">Save draft</button>
            <button disabled={saving} className="h-12 bg-[#2e75b6] px-6 font-semibold text-white">{saving ? 'Saving...' : 'Publish audition'}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold">{label}<input type={type} required={required} min={type === 'number' ? 1 : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field mt-2" /></label>;
}
