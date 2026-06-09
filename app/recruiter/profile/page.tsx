'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createRecruiterProfile,
  getRecruiterProfile,
} from '@/app/lib/firestore-service';
import type { RecruiterProfile } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { DevFormPresets } from '@/components/dev-form-presets';

const initialProfile: RecruiterProfile = {
  companyName: '',
  phone: '',
  address: '',
  website: '',
  bio: '',
  companyLogo: '',
  isVerified: false,
};

const recruiterPresets: Array<{
  label: string;
  description: string;
  data: RecruiterProfile;
}> = [
  {
    label: 'Production studio',
    description: 'Film and branded-content production company.',
    data: {
      companyName: 'Northstar Motion Pictures',
      phone: '+91 98765 41020',
      address: 'Andheri West, Mumbai, Maharashtra',
      website: 'https://northstar-motion.example.com',
      bio: 'Independent production studio developing regional films, digital series, and branded stories. We work with emerging performers and transparent casting briefs.',
      companyLogo: '',
      isVerified: false,
    },
  },
  {
    label: 'Casting agency',
    description: 'Boutique casting team for screen and advertising.',
    data: {
      companyName: 'Open Frame Casting',
      phone: '+91 98450 22119',
      address: 'Indiranagar, Bengaluru, Karnataka',
      website: 'https://openframe.example.com',
      bio: 'Boutique casting agency connecting directors with distinctive actors, models, dancers, and voice talent for commercials, films, and streaming productions.',
      companyLogo: '',
      isVerified: false,
    },
  },
  {
    label: 'Theatre company',
    description: 'Touring theatre and live-performance organisation.',
    data: {
      companyName: 'Juniper Stage Collective',
      phone: '+91 98102 77341',
      address: 'Mandi House, New Delhi',
      website: 'https://juniper-stage.example.com',
      bio: 'Contemporary theatre collective producing original plays and touring performances. Our casting process values preparation, accessibility, and diverse stage experience.',
      companyLogo: '',
      isVerified: false,
    },
  },
  {
    label: 'Advertising agency',
    description: 'Creative agency casting lifestyle and digital campaigns.',
    data: {
      companyName: 'Signal House Creative',
      phone: '+91 98201 44782',
      address: 'Lower Parel, Mumbai, Maharashtra',
      website: 'https://signalhouse.example.com',
      bio: 'Integrated creative agency producing national digital, lifestyle, and product campaigns. Our casting briefs include clear usage, rates, schedules, and callback expectations.',
      companyLogo: '',
      isVerified: false,
    },
  },
  {
    label: 'Audio studio',
    description: 'Remote-first studio for voice-over and dubbing projects.',
    data: {
      companyName: 'Clearwave Audio Works',
      phone: '+91 80471 99221',
      address: 'Koramangala, Bengaluru, Karnataka',
      website: 'https://clearwave-audio.example.com',
      bio: 'Audio production and localisation studio casting voice talent for commercials, animation, explainers, dubbing, and multilingual digital products.',
      companyLogo: '',
      isVerified: false,
    },
  },
];

export default function RecruiterProfilePage() {
  const router = useRouter();
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
      setMessage('Company profile saved. Opening verification status...');
      router.push('/recruiter/verification');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save company profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-[#008ca6]">
          Recruiter onboarding
        </p>
        <h1 className="mt-1 text-3xl font-bold">Company profile</h1>
        <p className="mt-2 text-[#68727c]">
          Complete company details before publishing auditions.
        </p>
        <div className="mt-6">
          <DevFormPresets
            title="Choose a company type to fill a realistic recruiter profile."
            presets={recruiterPresets}
            onSelect={(data) => {
              setProfile(data);
              setError('');
              setMessage('');
            }}
            onClear={() => {
              setProfile(initialProfile);
              setError('');
              setMessage('');
            }}
          />
        </div>
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
            <button disabled={saving} className="h-12 bg-[#008ca6] px-6 font-semibold text-white disabled:opacity-50">
              {saving ? 'Saving...' : 'Save company profile'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
