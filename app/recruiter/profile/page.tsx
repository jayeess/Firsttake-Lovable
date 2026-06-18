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
import { VerifiedBadge } from '@/components/verified-badge';
import { NotificationPreferencesForm } from '@/components/notification-preferences-form';
import {
  PrivacyNote,
  ProfileHero,
  ProfileSection,
  ProfileStat,
  ReadinessChecklist,
} from '@/components/profile-ui';

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
  const verificationStatus = profile.verificationStatus ?? 'not_submitted';
  const companyReady = Boolean(profile.companyName && profile.bio);
  const contactReady = Boolean(profile.phone && profile.address);
  const websiteReady = Boolean(profile.website);

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
      <div className="max-w-6xl">
        <ProfileHero
          eyebrow="Recruiter profile"
          title={profile.companyName || 'Company profile'}
          description="Build the company trust layer casting teams need before publishing auditions and messaging Talent."
          meta={
            <>
              <ProfileStat
                label="Verification"
                value={verificationStatus.replace('_', ' ')}
                tone={verificationStatus === 'approved' ? 'success' : 'attention'}
              />
              <ProfileStat
                label="Company info"
                value={companyReady ? 'Ready' : 'Incomplete'}
                tone={companyReady ? 'success' : 'attention'}
              />
              <ProfileStat
                label="Contact"
                value={contactReady ? 'Ready' : 'Missing'}
                tone={contactReady ? 'success' : 'attention'}
              />
            </>
          }
          primaryAction={
            <button
              type="submit"
              disabled={saving}
              form="recruiter-profile-form"
              className="primary-button disabled:opacity-50 sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          }
          secondaryAction={{ href: '/recruiter/verification', label: 'Verification status' }}
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-md border border-[#d7e2e6] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="eyebrow">Company trust</p>
                <h2 className="mt-2 text-2xl font-black">
                  {verificationStatus === 'approved'
                    ? 'Approved to publish'
                    : 'Complete profile, then verify'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
                  Recruiter verification helps Talent understand who is behind
                  each casting call. Approved accounts can publish with stronger
                  trust signals.
                </p>
              </div>
              {verificationStatus === 'approved' && <VerifiedBadge />}
            </div>
          </section>
          <ReadinessChecklist
            title="Recruiter readiness"
            items={[
              { label: 'Company name and bio', complete: companyReady },
              { label: 'Phone and address', complete: contactReady },
              { label: 'Website or proof link', complete: websiteReady },
              { label: 'Verification submitted', complete: verificationStatus !== 'not_submitted' },
              { label: 'Approved to publish', complete: verificationStatus === 'approved' },
            ]}
          />
        </div>

        <PrivacyNote title="Trust and safety expectation" className="mt-4">
          Recruiter profiles should clearly identify the company or casting
          team. Do not request pay-to-audition fees, personal contact details
          too early, or unsafe off-platform communication.
        </PrivacyNote>

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
        <form id="recruiter-profile-form" onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <ProfileSection
            eyebrow="Company details"
            title="Who is casting?"
            description="This information helps Talent evaluate whether a casting call is credible."
          >
            <div className="grid gap-5 md:grid-cols-2">
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
            </div>
          </ProfileSection>

          <ProfileSection
            eyebrow="Casting identity"
            title="How Talent should understand your team"
            description="Keep the bio specific: project types, casting style, transparency standards, and response expectations."
          >
            <label className="block text-sm font-semibold">
              Company bio
              <textarea maxLength={500} rows={5} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="field mt-2 py-3" />
            </label>
            <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Verification documents and admin approval are the next onboarding
              phase. Your profile currently remains pending verification unless
              already approved.
            </div>
          </ProfileSection>

          <div className="sticky bottom-20 z-20 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
            <button disabled={saving} className="primary-button disabled:opacity-50 md:w-auto">
              {saving ? 'Saving...' : 'Save company profile'}
            </button>
          </div>
        </form>
        {user && <NotificationPreferencesForm uid={user.uid} />}
      </div>
    </AppShell>
  );
}
