'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/context/auth-context';
import {
  createTalentProfile,
  getTalentProfile,
  getTalentVerification,
  submitTalentVerification,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type TalentProfile,
  type TalentVerification,
} from '@/app/lib/types';
import { getErrorMessage } from '@/app/lib/error-utils';
import { DevFormPresets } from '@/components/dev-form-presets';
import {
  canSubmitTalentVerification,
} from '@/app/lib/talent-trust-policy';
import {
  calculateTalentProfileCompleteness,
  TALENT_VERIFICATION_MINIMUM_SCORE,
} from '@/app/lib/profile-completeness';
import { VerifiedBadge } from '@/components/verified-badge';
import { TalentMediaManager } from '@/components/talent-media-manager';
import { PublicTalentProfileSettings } from '@/components/public-talent-profile-settings';
import { NotificationPreferencesForm } from '@/components/notification-preferences-form';
import { EmailVerificationPrompt } from '@/components/email-verification-prompt';
import {
  PrivacyNote,
  ProfileHero,
  ProfileSection,
  ProfileStat,
  ReadinessChecklist,
} from '@/components/profile-ui';

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
  skills: [],
  languages: [],
  isPublic: true,
};

const talentPresets: Array<{
  label: string;
  description: string;
  data: TalentProfile;
}> = [
  {
    label: 'Screen actor',
    description: 'Mumbai-based actor with theatre and short-film experience.',
    data: {
      firstName: 'Aarav',
      lastName: 'Mehta',
      age: 24,
      gender: 'MALE',
      height: '5 ft 10 in',
      bio: 'Screen and theatre actor trained in contemporary performance, improvisation, and Hindi-English dialogue. Experienced in short films, student productions, and commercial auditions.',
      category: 'ACTOR',
      experienceLevel: '1_3_YRS',
      location: 'Mumbai, Maharashtra',
      instagramUrl: 'https://instagram.com/aarav.demo',
      youtubeUrl: 'https://youtube.com/@aarav-demo',
      websiteUrl: 'https://aarav-demo.example.com',
      skills: ['Screen acting', 'Improvisation', 'Theatre'],
      languages: ['Hindi', 'English'],
      isPublic: true,
    },
  },
  {
    label: 'Commercial dancer',
    description: 'Bengaluru performer focused on contemporary and hip-hop.',
    data: {
      firstName: 'Maya',
      lastName: 'Rao',
      age: 22,
      gender: 'FEMALE',
      height: '5 ft 6 in',
      bio: 'Commercial dancer and movement performer specialising in contemporary, hip-hop, and camera choreography. Comfortable with fast rehearsals, ensemble work, and branded content.',
      category: 'DANCER',
      experienceLevel: '3_5_YRS',
      location: 'Bengaluru, Karnataka',
      instagramUrl: 'https://instagram.com/maya.moves.demo',
      youtubeUrl: 'https://youtube.com/@maya-moves-demo',
      websiteUrl: '',
      skills: ['Contemporary dance', 'Hip-hop', 'Camera choreography'],
      languages: ['English', 'Kannada'],
      isPublic: true,
    },
  },
  {
    label: 'Voice artist',
    description: 'Delhi voice performer for ads, narration, and characters.',
    data: {
      firstName: 'Kabir',
      lastName: 'Sethi',
      age: 29,
      gender: 'MALE',
      height: '5 ft 9 in',
      bio: 'Bilingual Hindi-English voice artist with a warm conversational tone and character range. Available for commercials, explainers, animation, dubbing, and long-form narration.',
      category: 'VOICE_ARTIST',
      experienceLevel: '5_PLUS_YRS',
      location: 'New Delhi',
      instagramUrl: '',
      youtubeUrl: 'https://youtube.com/@kabir-voice-demo',
      websiteUrl: 'https://kabirvoice.example.com',
      skills: ['Voice acting', 'Dubbing', 'Narration'],
      languages: ['Hindi', 'English'],
      isPublic: true,
    },
  },
  {
    label: 'Fashion model',
    description: 'Chennai model building editorial and commercial credits.',
    data: {
      firstName: 'Ananya',
      lastName: 'Iyer',
      age: 23,
      gender: 'FEMALE',
      height: '5 ft 8 in',
      bio: 'Editorial and commercial model with experience in beauty, lifestyle, and e-commerce shoots. Confident with movement direction, fittings, and natural-light campaigns.',
      category: 'MODEL',
      experienceLevel: '1_3_YRS',
      location: 'Chennai, Tamil Nadu',
      instagramUrl: 'https://instagram.com/ananya.portfolio.demo',
      youtubeUrl: '',
      websiteUrl: 'https://ananya-model.example.com',
      skills: ['Editorial posing', 'E-commerce shoots', 'Movement direction'],
      languages: ['Tamil', 'English'],
      isPublic: true,
    },
  },
  {
    label: 'News anchor',
    description: 'Hyderabad presenter with bilingual on-camera experience.',
    data: {
      firstName: 'Rohan',
      lastName: 'Varma',
      age: 31,
      gender: 'MALE',
      height: '5 ft 11 in',
      bio: 'Bilingual English-Telugu presenter and anchor experienced in interviews, live events, explainers, and corporate films. Strong teleprompter delivery and unscripted conversation.',
      category: 'ANCHOR',
      experienceLevel: '5_PLUS_YRS',
      location: 'Hyderabad, Telangana',
      instagramUrl: 'https://instagram.com/rohan.anchor.demo',
      youtubeUrl: 'https://youtube.com/@rohan-anchor-demo',
      websiteUrl: '',
      skills: ['Anchoring', 'Teleprompter', 'Live interviews'],
      languages: ['Telugu', 'English', 'Hindi'],
      isPublic: true,
    },
  },
  {
    label: 'New performer',
    description: 'Pune fresher for testing a minimal but complete profile.',
    data: {
      firstName: 'Ishaan',
      lastName: 'Kulkarni',
      age: 19,
      gender: 'OTHER',
      height: '5 ft 7 in',
      bio: 'New performer with theatre workshop training, strong preparation habits, and an interest in youth drama, digital commercials, and ensemble roles.',
      category: 'ACTOR',
      experienceLevel: 'FRESHER',
      location: 'Pune, Maharashtra',
      instagramUrl: '',
      youtubeUrl: '',
      websiteUrl: '',
      skills: ['Theatre workshops', 'Ensemble acting'],
      languages: ['Hindi', 'Marathi'],
      isPublic: true,
    },
  },
];

export default function TalentProfilePage() {
  const { user, emailVerified } = useAuth();
  const [profile, setProfile] = useState<TalentProfile>(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verification, setVerification] =
    useState<TalentVerification | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getTalentProfile(user.uid),
      getTalentVerification(user.uid),
    ])
      .then(([data, verificationData]) => {
        if (data) {
          setProfile(data);
          setProfileSaved(true);
        }
        setVerification(verificationData);
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load profile'))
      );
  }, [user]);

  const completeness = useMemo(
    () => calculateTalentProfileCompleteness(profile),
    [profile]
  );
  const verificationStatus =
    verification?.talentVerificationStatus ??
    profile.talentVerificationStatus ??
    'not_submitted';
  const checklist = completeness.checklist;
  const missingCount = completeness.missingFields.length;
  const missingSummary =
    missingCount > 0
      ? `Missing: ${completeness.missingFields.slice(0, 2).join(', ')}${
          missingCount > 2 ? `, and ${missingCount - 2} more` : ''
        }`
      : 'Everything required for the current profile score is complete.';
  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    'Talent profile';
  const publicStatus = profile.publicProfileEnabled || profile.isPublic;
  const profileActionHref = missingCount > 0 ? '#profile-completeness' : '#profile-form';

  const update = <K extends keyof TalentProfile>(
    key: K,
    value: TalentProfile[K]
  ) => setProfile((current) => ({ ...current, [key]: value }));
  const updateList = (key: 'skills' | 'languages', value: string) =>
    update(
      key,
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await createTalentProfile(user.uid, profile);
      setProfile((current) => ({
        ...current,
        profileCompletenessScore: completeness.score,
        profileCompletenessChecklist: completeness.checklist,
      }));
      setProfileSaved(true);
      setMessage('Your talent profile has been saved.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!user) return;
    setSubmittingVerification(true);
    setError('');
    setMessage('');
    try {
      await createTalentProfile(user.uid, profile);
      await submitTalentVerification(user.uid);
      const updated = await getTalentVerification(user.uid);
      setVerification(updated);
      setProfile((current) => ({
        ...current,
        talentVerificationStatus: 'pending',
        profileCompletenessScore: completeness.score,
        profileCompletenessChecklist: completeness.checklist,
      }));
      setMessage('Your Talent profile was submitted for verification.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to submit verification'));
    } finally {
      setSubmittingVerification(false);
    }
  };

  return (
    <AppShell requiredRole="TALENT">
      <div className="max-w-6xl">
        <ProfileHero
          eyebrow="Talent profile"
          title={fullName}
          description="Shape how recruiters understand your casting fit. Your profile powers applications, verification, media, and public discovery."
          meta={
            <>
              <ProfileStat label="Completeness" value={`${completeness.score}%`} />
              <ProfileStat
                label="Verification"
                value={verificationStatus.replace('_', ' ')}
                tone={verificationStatus === 'verified' ? 'success' : 'attention'}
              />
              <ProfileStat
                label="Public profile"
                value={publicStatus ? 'On' : 'Off'}
                tone={publicStatus ? 'success' : 'neutral'}
              />
            </>
          }
          primaryAction={
            missingCount > 0 ? (
              <Link href={profileActionHref} className="primary-button sm:w-auto">
                Complete missing items
              </Link>
            ) : canSubmitTalentVerification(
              verificationStatus,
              completeness.score
            ) ? (
              <button
                type="button"
                onClick={() => void handleVerificationSubmit()}
                disabled={submittingVerification}
                className="primary-button disabled:opacity-50 sm:w-auto"
              >
                {submittingVerification
                  ? 'Submitting...'
                  : verificationStatus === 'rejected'
                    ? 'Resubmit verification'
                    : 'Submit verification'}
              </button>
            ) : undefined
          }
          secondaryAction={
            profile.publicSlug
              ? { href: `/t/${profile.publicSlug}`, label: 'Preview public profile' }
              : undefined
          }
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section
            id="profile-completeness"
            className="scroll-mt-24 rounded-md border border-[#d7e2e6] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="eyebrow">Profile readiness</p>
                <h2 className="mt-2 text-2xl font-black">
                  {completeness.score}% complete
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
                  {missingSummary} Verification is optional and does not block
                  auditions or applications. Reach{' '}
                  {TALENT_VERIFICATION_MINIMUM_SCORE}% to request a trust
                  review.
                </p>
              </div>
              {verificationStatus === 'verified' && <VerifiedBadge subject="talent" />}
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dbe4e8]">
              <div
                className="h-full rounded-full bg-[#008ca6]"
                style={{ width: `${completeness.score}%` }}
              />
            </div>
            {verificationStatus === 'pending' && (
              <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Your profile is in the private-beta review queue. You can keep
                improving it while the review is pending.
              </p>
            )}
            {verificationStatus === 'rejected' && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Review feedback:{' '}
                {verification?.rejectedReason ||
                  'Improve the missing profile details, then resubmit.'}
              </p>
            )}
            {verificationStatus === 'suspended' && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Talent verification is suspended. Contact the trust team before
                resubmitting.
              </p>
            )}
            {missingCount > 0 && (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">
                  Complete these to reach 100%
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900 sm:grid-cols-2">
                  {completeness.missingFields.map((item) => (
                    <li key={item} className="border-l-2 border-amber-300 pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <ReadinessChecklist
            title="What recruiters look for"
            description="Every missing item below contributes to the displayed completeness score."
            items={[
              {
                label: 'Basic identity',
                complete: checklist.basicInfo,
                hint: 'First and last name anchor your Talent profile across applications.',
                actionHref: '#basic-details',
                actionLabel: 'Edit basics',
              },
              {
                label: 'Casting details',
                complete: checklist.category && checklist.experience,
                hint: 'Category and experience make auditions and recommendations more relevant.',
                actionHref: '#casting-details',
                actionLabel: 'Edit casting details',
              },
              {
                label: 'Location and bio',
                complete: checklist.location && checklist.bio,
                hint: 'A clear location and 80+ character bio reduce recruiter guesswork.',
                actionHref: '#casting-details',
                actionLabel: 'Improve bio',
              },
              {
                label: 'Portfolio evidence',
                complete: checklist.portfolioMedia,
                hint: 'Add portfolio media, a YouTube reel, or a portfolio website so recruiters can review your work.',
                actionHref: '#media-portfolio',
                actionLabel: 'Manage media',
              },
              {
                label: 'Skills and languages',
                complete: checklist.skillsAndLanguages,
                hint: 'List at least one performance skill and one spoken language for better matching.',
                actionHref: '#skills-languages',
                actionLabel: 'Add skills',
              },
              {
                label: 'Extra casting context',
                complete:
                  checklist.demographics &&
                  checklist.professionalLinks &&
                  checklist.profilePhoto,
                hint: 'Age, gender, height, social links, and profile photo are useful but do not reduce completeness.',
                actionHref: '#basic-details',
                actionLabel: 'Add optional context',
                optional: true,
              },
              {
                label: 'Public profile ready',
                complete: publicStatus,
                hint: 'Useful for sharing your profile externally; it does not affect the trust score.',
                actionHref: '#public-profile',
                actionLabel: 'Review public settings',
                optional: true,
              },
            ]}
          />
        </div>

        <PrivacyNote title="What is visible where" className="mt-4">
          Recruiters see profile details when you apply. Public profile settings
          control what appears on your shareable profile. Verification notes and
          private account data stay internal.
        </PrivacyNote>
        {!emailVerified && (
          <div className="mt-4">
            <EmailVerificationPrompt />
          </div>
        )}
        {user && profileSaved ? (
          <>
            <div id="media-portfolio" className="scroll-mt-24">
              <TalentMediaManager
                uid={user.uid}
                profile={profile}
                onProfileChange={(updates) =>
                  setProfile((current) => ({ ...current, ...updates }))
                }
              />
            </div>
            <div id="public-profile" className="scroll-mt-24">
              <PublicTalentProfileSettings
                profile={profile}
                onProfileChange={(updates) =>
                  setProfile((current) => ({ ...current, ...updates }))
                }
              />
            </div>
            <NotificationPreferencesForm uid={user.uid} />
          </>
        ) : (
          <section className="surface mt-6 p-6">
            <p className="eyebrow">Media portfolio</p>
            <h2 className="mt-2 text-2xl font-black">
              Save your profile to add media
            </h2>
            <p className="mt-2 text-sm text-[#657176]">
              Your basic Talent profile creates the secure owner record used by
              profile photos and portfolio uploads.
            </p>
          </section>
        )}
        <div className="mt-6">
          <DevFormPresets
            title="Choose a ready-made talent profile to preview the completed experience."
            presets={talentPresets}
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
        <form id="profile-form" onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <ProfileSection
            id="basic-details"
            eyebrow="Basic identity"
            title="Who recruiters are reviewing"
            description="These details establish your basic casting profile and are shown when you apply."
          >
            <div className="grid gap-5 md:grid-cols-2">
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
            </div>
          </ProfileSection>

          <ProfileSection
            id="casting-details"
            eyebrow="Casting details"
            title="Your professional positioning"
            description="Make it easy for casting teams to understand the kinds of roles you fit."
          >
            <div className="grid gap-5 md:grid-cols-2">
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
              <div className="md:col-span-2">
                <Field label="Professional bio">
                  <textarea maxLength={500} rows={5} value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="field py-3" />
                </Field>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection
            id="skills-languages"
            eyebrow="Skills and languages"
            title="Matching signals"
            description="These improve audition recommendations and help recruiters scan your strengths quickly."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Skills">
                <input
                  value={(profile.skills ?? []).join(', ')}
                  onChange={(e) => updateList('skills', e.target.value)}
                  placeholder="Screen acting, dance, dubbing"
                  className="field"
                />
              </Field>
              <Field label="Languages">
                <input
                  value={(profile.languages ?? []).join(', ')}
                  onChange={(e) => updateList('languages', e.target.value)}
                  placeholder="Telugu, Hindi, English"
                  className="field"
                />
              </Field>
            </div>
          </ProfileSection>

          <ProfileSection
            eyebrow="Portfolio links"
            title="Work samples and public reach"
            description="Links help recruiters understand your work before requesting callbacks or self-tapes."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Instagram URL">
                <input type="url" value={profile.instagramUrl} onChange={(e) => update('instagramUrl', e.target.value)} className="field" />
              </Field>
              <Field label="YouTube URL">
                <input type="url" value={profile.youtubeUrl} onChange={(e) => update('youtubeUrl', e.target.value)} className="field" />
              </Field>
              <Field label="Portfolio website">
                <input type="url" value={profile.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} className="field" />
              </Field>
              <label className="flex min-h-12 items-center gap-3 rounded-md border border-[#d7e2e6] bg-[#f8fbfc] px-3 text-sm font-semibold">
                <input type="checkbox" checked={profile.isPublic} onChange={(e) => update('isPublic', e.target.checked)} />
                Public profile enabled
              </label>
            </div>
          </ProfileSection>

          <div className="sticky bottom-20 z-20 rounded-md border border-[#cbd6db] bg-white/95 p-3 shadow-lg backdrop-blur lg:bottom-4">
            <button disabled={saving} className="primary-button disabled:opacity-50 sm:w-auto">
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
