'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createRecruiterProfile,
  getRecruiterProfile,
} from '@/app/lib/firestore-service';
import type { RecruiterProfile } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';

const initialProfile: RecruiterProfile = {
  companyName: '',
  phone: '',
  address: '',
  website: '',
  bio: '',
  companyLogo: '',
  isVerified: false,
};

export default function RecruiterProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getRecruiterProfile(user.uid)
      .then((data) => data && setProfile({ ...initialProfile, ...data }))
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load company profile'))
      );
  }, [user]);

  const update = (key: keyof RecruiterProfile, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await createRecruiterProfile(user.uid, profile);
      setMessage('Company profile saved. Verification remains pending.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save company profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-[#2e75b6]">
          Recruiter onboarding
        </p>
        <h1 className="mt-1 text-3xl font-bold">Company profile</h1>
        <p className="mt-2 text-[#68727c]">
          Complete company details before publishing auditions.
        </p>
        {(message || error) && (
          <p className={`mt-5 border p-3 text-sm ${error ? 'border-red-300 bg-red-50 text-red-800' : 'border-green-300 bg-green-50 text-green-800'}`}>
            {error || message}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 border border-[#d9dee5] bg-white p-6 sm:grid-cols-2">
          {[
            ['companyName', 'Company name', 'text'],
            ['phone', 'Company phone', 'tel'],
            ['address', 'Company address', 'text'],
            ['website', 'Website', 'url'],
          ].map(([key, label, type]) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <input
                type={type}
                required={key !== 'website'}
                value={String(profile[key as keyof RecruiterProfile] ?? '')}
                onChange={(e) => update(key as keyof RecruiterProfile, e.target.value)}
                className="field mt-2"
              />
            </label>
          ))}
          <label className="block text-sm font-semibold sm:col-span-2">
            Company bio
            <textarea maxLength={500} rows={5} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="field mt-2 py-3" />
          </label>
          <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:col-span-2">
            Verification documents and admin approval are the next onboarding
            phase. Your profile currently remains pending verification.
          </div>
          <div className="sm:col-span-2">
            <button disabled={saving} className="h-12 bg-[#2e75b6] px-6 font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Save company profile'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
