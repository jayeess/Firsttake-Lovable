'use client';

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
  calculateTalentProfileCompleteness,
  canSubmitTalentVerification,
  TALENT_VERIFICATION_MINIMUM_SCORE,
} from '@/app/lib/talent-trust-policy';
import { VerifiedBadge } from '@/components/verified-badge';

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
      isPublic: true,
    },
  },
];

export default function TalentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TalentProfile>(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verification, setVerification] =
    useState<TalentVerification | null>(null);

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      getTalentProfile(user.uid),
      getTalentVerification(user.uid),
    ])
      .then(([data, verificationData]) => {
        if (data) setProfile(data);
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
      setProfile((current) => ({
        ...current,
        profileCompletenessScore: completeness.score,
        profileCompletenessChecklist: completeness.checklist,
      }));
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
      <div className="max-w-4xl">
        <p className="text-sm font-bold uppercase text-[#008ca6]">
          Talent profile
        </p>
        <h1 className="mt-1 text-3xl font-bold">Build your professional profile</h1>
        <p className="mt-2 text-[#68727c]">
          This information is shown to recruiters when you apply.
        </p>
        <section className="surface mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="eyebrow">Profile trust</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black">
                  {completeness.score}% complete
                </h2>
                {verificationStatus === 'verified' ? (
                  <VerifiedBadge subject="talent" />
                ) : (
                  <span className="border border-[#c6d3d8] bg-[#f4f7f8] px-3 py-1 text-xs font-black uppercase text-[#526874]">
                    {verificationStatus.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
                Verification is optional and does not block auditions or
                applications. Reach {TALENT_VERIFICATION_MINIMUM_SCORE}% to
                request a trust review.
              </p>
            </div>
            {canSubmitTalentVerification(
              verificationStatus,
              completeness.score
            ) && (
              <button
                type="button"
                onClick={() => void handleVerificationSubmit()}
                disabled={submittingVerification}
                className="primary-button disabled:opacity-50"
              >
                {submittingVerification
                  ? 'Submitting...'
                  : verificationStatus === 'rejected'
                    ? 'Resubmit for verification'
                    : 'Submit for verification'}
              </button>
            )}
          </div>
          <div className="mt-5 h-2 overflow-hidden bg-[#dbe4e8]">
            <div
              className="h-full bg-[#008ca6]"
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          {verificationStatus === 'pending' && (
            <p className="mt-4 border-l-2 border-[#e7ad2d] pl-3 text-sm">
              Your profile is in the private-beta review queue. You can keep
              improving it while the review is pending.
            </p>
          )}
          {verificationStatus === 'rejected' && (
            <p className="mt-4 border-l-2 border-red-400 pl-3 text-sm text-red-800">
              Review feedback:{' '}
              {verification?.rejectedReason ||
                'Improve the missing profile details, then resubmit.'}
            </p>
          )}
          {verificationStatus === 'suspended' && (
            <p className="mt-4 border-l-2 border-red-500 pl-3 text-sm text-red-800">
              Talent verification is suspended. Contact the trust team before
              resubmitting.
            </p>
          )}
          {completeness.missingFields.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-black">Recommended next actions</p>
              <ul className="mt-2 grid gap-2 text-sm text-[#657176] sm:grid-cols-2">
                {completeness.missingFields.map((item) => (
                  <li key={item} className="border-l-2 border-[#b8c7cd] pl-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
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
            <button disabled={saving} className="h-12 bg-[#008ca6] px-6 font-semibold text-white disabled:opacity-50">
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
