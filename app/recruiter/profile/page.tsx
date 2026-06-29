'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createRecruiterProfile,
  getRecruiterProfile,
} from '@/app/lib/firestore-service';
import type { RecruiterProfile } from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import {
  getRecruiterTrustImprovementTips,
  getRecruiterTrustPassport,
} from '@/app/lib/recruiter-trust-passport-policy';
import { DevFormPresets } from '@/components/dev-form-presets';
import { VerifiedBadge } from '@/components/verified-badge';
import { NotificationPreferencesForm } from '@/components/notification-preferences-form';
import { EmailVerificationPrompt } from '@/components/email-verification-prompt';
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
  const { user, emailVerified } = useAuth();
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
  const recruiterReadinessItems = [
    !companyReady ? 'Company name and bio' : '',
    !contactReady ? 'Phone and address' : '',
    !websiteReady ? 'Website or proof link' : '',
    verificationStatus === 'not_submitted' ? 'Verification submission' : '',
    verificationStatus !== 'approved' ? 'Admin approval' : '',
  ].filter(Boolean);
  const trustPassport = getRecruiterTrustPassport(profile, null, {
    verificationStatus,
  });
  const trustImprovementTips = getRecruiterTrustImprovementTips(profile, {
    verificationStatus,
  });

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
            recruiterReadinessItems.length > 0 ? (
              <Link href="#recruiter-readiness" className="primary-button sm:w-auto">
                Complete trust setup
              </Link>
            ) : (
              <Link href="/recruiter/auditions/new" className="primary-button sm:w-auto">
                Create audition
              </Link>
            )
          }
          secondaryAction={{
            href: verificationStatus === 'not_submitted'
              ? '/recruiter/verification'
              : '#recruiter-profile-form',
            label: verificationStatus === 'not_submitted'
              ? 'Submit verification'
              : 'Update profile',
          }}
        />

        <div id="recruiter-readiness" className="mt-5 grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
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
            {recruiterReadinessItems.length > 0 && (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">
                  Complete these before the profile feels fully trusted
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900 sm:grid-cols-2">
                  {recruiterReadinessItems.map((item) => (
                    <li key={item} className="border-l-2 border-amber-300 pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <ReadinessChecklist
            title="Recruiter readiness"
            description="These signals tell Talent whether the casting organization is credible and ready to publish."
            items={[
              {
                label: 'Company name and bio',
                complete: companyReady,
                hint: 'Talent should understand who is casting and what your team does.',
                actionHref: '#company-details',
                actionLabel: 'Edit company',
              },
              {
                label: 'Phone and address',
                complete: contactReady,
                hint: 'Contact details support accountability and admin review.',
                actionHref: '#company-details',
                actionLabel: 'Add contact',
              },
              {
                label: 'Website or proof link',
                complete: websiteReady,
                hint: 'A public company or portfolio link strengthens credibility.',
                actionHref: '#company-details',
                actionLabel: 'Add website',
              },
              {
                label: 'Verification submitted',
                complete: verificationStatus !== 'not_submitted',
                hint: 'Submit documents and company context for admin review.',
                actionHref: '/recruiter/verification',
                actionLabel: 'Open verification',
              },
              {
                label: 'Approved to publish',
                complete: verificationStatus === 'approved',
                hint: 'Admin approval unlocks the strongest recruiter trust signal.',
                actionHref: '/recruiter/verification',
                actionLabel: 'Check status',
              },
            ]}
          />
        </div>

        <section className="mt-4 rounded-md border border-[#d7e2e6] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Recruiter Trust Passport</p>
              <h2 className="mt-2 text-2xl font-black">
                {trustPassport.bandLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
                This is the public trust context Talent sees around your
                source name, verification status, company context, and casting
                safety expectations.
              </p>
            </div>
            <span className="w-fit rounded-md border border-[#bad7d3] bg-[#edf7f5] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#006b60]">
              {trustPassport.sourceName}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {trustPassport.publicSignals.slice(0, 4).map((signal) => (
              <div
                key={signal.key}
                className="rounded-md border border-[#d7e3e7] bg-[#f8fbfc] p-3"
              >
                <p className="text-sm font-black">{signal.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#657176]">
                  {signal.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-950">
              Next trust improvements
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">
              {trustImprovementTips.slice(0, 3).map((tip) => (
                <li key={tip} className="border-l-2 border-amber-300 pl-3">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <PrivacyNote title="Trust and safety expectation" className="mt-4">
          Recruiter profiles should clearly identify the company or casting
          team. Do not request pay-to-audition fees, personal contact details
          too early, or unsafe off-platform communication.
        </PrivacyNote>
        {!emailVerified && (
          <div className="mt-4">
            <EmailVerificationPrompt />
          </div>
        )}

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
            id="company-details"
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
                <label key={key} className="block text-sm font-bold">
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
            id="casting-identity"
            eyebrow="Casting identity"
            title="How Talent should understand your team"
            description="Keep the bio specific: project types, casting style, transparency standards, and response expectations."
          >
            <label className="block text-sm font-bold">
              Company bio
              <textarea maxLength={500} rows={5} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="field mt-2 py-3" placeholder="Example: Short description of your company, project types, casting process, and response expectations." />
            </label>
            <PrivacyNote title="Platform safety expectation" className="mt-5">
              Casting briefs on Nata Connect must not charge Talent. Never
              request fees, deposits, or payments as part of any audition or
              casting process.
            </PrivacyNote>
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
