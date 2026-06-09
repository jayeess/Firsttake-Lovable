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
      <div className="max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Create casting call</p>
            <h1 className="mt-2 text-4xl font-black">Shape the opportunity clearly.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
              Strong briefs attract stronger applicants. Give talent enough
              context to know whether the role truly fits.
            </p>
          </div>
          <div className="border-l-2 border-[#d8a843] pl-4 text-sm">
            <p className="font-bold">Recruiter access</p>
            <p className="mt-1 text-[#657176]">
              {userType === 'RECRUITER' ? 'Ready to publish' : 'Role not detected'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800">
            <p className="font-bold">The audition was not saved</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void publish('ACTIVE');
          }}
          className="mt-7 grid gap-6 lg:grid-cols-[1fr_290px]"
        >
          <div className="space-y-5">
            <section className="surface p-6">
              <p className="eyebrow">01 · Role basics</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Audition title" value={form.title} onChange={(v) => update('title', v)} placeholder="e.g. Lead actor for regional drama" />
                </div>
                <label className="block text-sm font-bold">Category<select value={form.category} onChange={(e) => update('category', e.target.value)} className="field mt-2">{Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="block text-sm font-bold">Experience level<select value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value)} className="field mt-2">{Object.entries(EXPERIENCE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <Input label="Location" value={form.location} onChange={(v) => update('location', v)} placeholder="City or remote" />
                <Input label="Project duration" value={form.duration} onChange={(v) => update('duration', v)} placeholder="e.g. 3 shooting days" />
              </div>
            </section>

            <section className="surface p-6">
              <p className="eyebrow">02 · Creative brief</p>
              <label className="mt-5 block text-sm font-bold">Role description<textarea required rows={7} value={form.description} onChange={(e) => update('description', e.target.value)} className="field mt-2" placeholder="Describe the project, character, tone, and what makes this role distinctive." /></label>
              <label className="mt-5 block text-sm font-bold">Requirements<textarea required rows={6} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} className="field mt-2" placeholder="Skills, language, age range, availability, and portfolio expectations." /></label>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface p-5">
              <p className="eyebrow">03 · Publishing</p>
              <div className="mt-5 space-y-5">
                <Input label="Positions" type="number" value={String(form.numberOfPositions)} onChange={(v) => update('numberOfPositions', Number(v))} />
                <Input label="Application deadline" type="date" value={form.deadline} onChange={(v) => update('deadline', v)} />
                <Input label="Pay information" value={form.payInfo} onChange={(v) => update('payInfo', v)} required={false} placeholder="Optional, but recommended" />
              </div>
            </section>
            <section className="border border-[#bad7d3] bg-[#edf7f5] p-5 text-sm leading-6 text-[#234b47]">
              <p className="font-bold">Before you publish</p>
              <p className="mt-2">
                Review the deadline, location, pay details, and requirements.
                Published auditions become visible to talent immediately.
              </p>
            </section>
            <div className="grid gap-3">
              <button type="submit" disabled={saving} className="primary-button w-full disabled:opacity-50">
                {saving ? 'Publishing...' : 'Publish audition'}
              </button>
              <button type="button" disabled={saving} onClick={() => void publish('DRAFT')} className="secondary-button w-full">
                Save as draft
              </button>
            </div>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm font-bold">{label}<input type={type} required={required} min={type === 'number' ? 1 : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field mt-2" /></label>;
}
