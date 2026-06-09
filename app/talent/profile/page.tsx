'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createTalentProfile,
  getTalentProfile,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type TalentProfile,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';

const initialProfile: TalentProfile = {
  firstName: '',
  lastName: '',
  age: 18,
  gender: 'OTHER',
  height: '',
  bio: '',
  category: 'ACTOR',
  experienceLevel: 'FRESHER',
  location: '',
  instagramUrl: '',
  youtubeUrl: '',
  websiteUrl: '',
  isPublic: true,
};

export default function TalentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TalentProfile>(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getTalentProfile(user.uid)
      .then((data) => data && setProfile(data))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load profile'))
      );
  }, [user]);

  const update = <K extends keyof TalentProfile>(
    key: K,
    value: TalentProfile[K]
  ) => setProfile((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await createTalentProfile(user.uid, profile);
      setMessage('Your talent profile has been saved.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase text-[#2e75b6]">
          Talent profile
        </p>
        <h1 className="mt-1 text-3xl font-bold">Build your professional profile</h1>
        <p className="mt-2 text-[#68727c]">
          This information is shown to recruiters when you apply.
        </p>
        {(message || error) && (
          <p
            className={`mt-5 border p-3 text-sm ${
              error
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-green-300 bg-green-50 text-green-800'
            }`}
          >
            {error || message}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 border border-[#d9dee5] bg-white p-6 sm:grid-cols-2"
        >
          <Field label="First name">
            <input required value={profile.firstName} onChange={(e) => update('firstName', e.target.value)} className="field" />
          </Field>
          <Field label="Last name">
            <input required value={profile.lastName} onChange={(e) => update('lastName', e.target.value)} className="field" />
          </Field>
          <Field label="Age">
            <input type="number" min="18" required value={profile.age} onChange={(e) => update('age', Number(e.target.value))} className="field" />
          </Field>
          <Field label="Gender">
            <select value={profile.gender} onChange={(e) => update('gender', e.target.value as TalentProfile['gender'])} className="field">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Height">
            <input required placeholder="e.g. 5 ft 8 in" value={profile.height} onChange={(e) => update('height', e.target.value)} className="field" />
          </Field>
          <Field label="Location">
            <input required value={profile.location} onChange={(e) => update('location', e.target.value)} className="field" />
          </Field>
          <Field label="Category">
            <select value={profile.category} onChange={(e) => update('category', e.target.value as TalentProfile['category'])} className="field">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Experience">
            <select value={profile.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value as TalentProfile['experienceLevel'])} className="field">
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Professional bio">
              <textarea maxLength={500} rows={5} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="field py-3" />
            </Field>
          </div>
          <Field label="Instagram URL">
            <input type="url" value={profile.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} className="field" />
          </Field>
          <Field label="YouTube URL">
            <input type="url" value={profile.youtubeUrl} onChange={(e) => update('youtubeUrl', e.target.value)} className="field" />
          </Field>
          <Field label="Portfolio website">
            <input type="url" value={profile.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} className="field" />
          </Field>
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={profile.isPublic} onChange={(e) => update('isPublic', e.target.checked)} />
            Public profile
          </label>
          <div className="sm:col-span-2">
            <button disabled={saving} className="h-12 bg-[#2e75b6] px-6 font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
