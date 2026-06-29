'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import {
  createAudition,
  ensureUserAccount,
  getRecruiterProfile,
  getRecruiterVerification,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type AuditionStatus,
  type AuditionType,
  type ExperienceLevel,
  type TalentCategory,
  type WorkMode,
  type PaymentType,
  type SelfTapeSubmissionType,
} from '@/app/lib/types';
import {
  normalizeSelfTapeSubmissionTypes,
  validateSelfTapeInstructions,
} from '@/app/lib/self-tape-policy';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';
import { DevFormPresets } from '@/components/dev-form-presets';

type AuditionForm = {
  title: string;
  description: string;
  category: TalentCategory;
  experienceLevel: ExperienceLevel;
  location: string;
  duration: string;
  requirements: string;
  numberOfPositions: number;
  payInfo: string;
  languages: string[];
  auditionType: AuditionType;
  workMode: WorkMode;
  paymentType: PaymentType;
  selfTapeEnabled: boolean;
  selfTapeRequired: boolean;
  selfTapeInstructions: string;
  selfTapeSubmissionTypes: SelfTapeSubmissionType[];
  selfTapeMaxDurationSeconds: number | null;
  deadline: string;
};

const emptyAudition: AuditionForm = {
  title: '',
  description: '',
  category: 'ACTOR',
  experienceLevel: 'FRESHER',
  location: '',
  duration: '',
  requirements: '',
  numberOfPositions: 1,
  payInfo: '',
  languages: [],
  auditionType: 'OTHER',
  workMode: 'ONSITE',
  paymentType: 'UNSPECIFIED',
  selfTapeEnabled: false,
  selfTapeRequired: false,
  selfTapeInstructions: '',
  selfTapeSubmissionTypes: ['link'],
  selfTapeMaxDurationSeconds: null,
  deadline: '',
};

const dateFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const auditionPresets: Array<{
  label: string;
  description: string;
  data: AuditionForm;
}> = [
  {
    label: 'Streaming drama',
    description: 'Lead actor casting call for a character-driven series.',
    data: {
      title: 'Lead actor for bilingual streaming drama',
      description: 'Casting a grounded lead performer for a six-episode Hindi-English drama about friendship, ambition, and family expectations in contemporary Mumbai.',
      category: 'ACTOR',
      experienceLevel: '1_3_YRS',
      location: 'Mumbai, Maharashtra',
      duration: '12 shooting days across 3 weeks',
      requirements: 'Playing age 22-28. Strong Hindi and conversational English. Natural screen presence, emotional range, and availability for an in-person callback.',
      numberOfPositions: 1,
      payInfo: 'Paid role. Final rate based on experience and production schedule.',
      languages: ['Hindi', 'English'],
      auditionType: 'SERIES',
      workMode: 'ONSITE',
      paymentType: 'PAID',
      selfTapeEnabled: false,
      selfTapeRequired: false,
      selfTapeInstructions: '',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: null,
      deadline: dateFromToday(21),
    },
  },
  {
    label: 'Fashion campaign',
    description: 'Commercial model brief for a national lifestyle brand.',
    data: {
      title: 'Models for national lifestyle campaign',
      description: 'Seeking expressive models for a warm, documentary-style campaign featuring everyday movement, friendship, and city life.',
      category: 'MODEL',
      experienceLevel: 'FRESHER',
      location: 'Bengaluru, Karnataka',
      duration: '2 shoot days plus fitting',
      requirements: 'Ages 20-35. All looks encouraged. Must submit current natural-light photographs and be comfortable with movement-led direction.',
      numberOfPositions: 6,
      payInfo: 'INR 18,000 per shoot day plus travel within the city.',
      languages: ['English'],
      auditionType: 'COMMERCIAL',
      workMode: 'ONSITE',
      paymentType: 'PAID',
      selfTapeEnabled: false,
      selfTapeRequired: false,
      selfTapeInstructions: '',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: null,
      deadline: dateFromToday(14),
    },
  },
  {
    label: 'Voice campaign',
    description: 'Hindi-English commercial voice-over opportunity.',
    data: {
      title: 'Warm bilingual voice for fintech campaign',
      description: 'A series of short digital commercials needs a reassuring, modern voice that feels informed without sounding formal.',
      category: 'VOICE_ARTIST',
      experienceLevel: '3_5_YRS',
      location: 'Remote',
      duration: 'One remote recording session, up to 3 hours',
      requirements: 'Fluent Hindi and English, broadcast-quality home setup, clean commercial demo, and availability for one directed online session.',
      numberOfPositions: 2,
      payInfo: 'INR 25,000 inclusive of digital usage for 6 months.',
      languages: ['Hindi', 'English'],
      auditionType: 'VOICE_OVER',
      workMode: 'REMOTE',
      paymentType: 'PAID',
      selfTapeEnabled: true,
      selfTapeRequired: true,
      selfTapeInstructions:
        'Submit a 60-90 second sample reading one warm commercial line in Hindi and one in English. Use a clean, quiet recording and share an unlisted video link.',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: 90,
      deadline: dateFromToday(10),
    },
  },
  {
    label: 'Dance film',
    description: 'Movement-led casting call for a music performance film.',
    data: {
      title: 'Contemporary dancers for urban music film',
      description: 'Casting expressive movement performers for a cinematic music film built around rhythm, city spaces, and ensemble storytelling.',
      category: 'DANCER',
      experienceLevel: '1_3_YRS',
      location: 'Hyderabad, Telangana',
      duration: '4 rehearsal days and 2 shoot days',
      requirements: 'Ages 18-30. Contemporary or commercial training, strong musicality, comfort with improvisation, and a recent movement reel.',
      numberOfPositions: 8,
      payInfo: 'INR 12,000 per shoot day. Rehearsals and local travel included.',
      languages: [],
      auditionType: 'FILM',
      workMode: 'ONSITE',
      paymentType: 'PAID',
      selfTapeEnabled: true,
      selfTapeRequired: false,
      selfTapeInstructions:
        'Optional: share a recent 45-60 second movement clip that shows musicality and full-body framing.',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: 60,
      deadline: dateFromToday(18),
    },
  },
  {
    label: 'Live presenter',
    description: 'Confident anchor for a technology launch event.',
    data: {
      title: 'Bilingual anchor for technology launch',
      description: 'Seeking a polished presenter to host a live product launch, conduct short founder interviews, and guide audience transitions.',
      category: 'ANCHOR',
      experienceLevel: '3_5_YRS',
      location: 'Gurugram, Haryana',
      duration: '1 rehearsal and 1 event day',
      requirements: 'Fluent English and Hindi, live-event experience, strong improvisation, professional showreel, and availability for an evening event.',
      numberOfPositions: 1,
      payInfo: 'INR 35,000 including rehearsal and event day.',
      languages: ['Hindi', 'English'],
      auditionType: 'LIVE_EVENT',
      workMode: 'ONSITE',
      paymentType: 'PAID',
      selfTapeEnabled: false,
      selfTapeRequired: false,
      selfTapeInstructions: '',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: null,
      deadline: dateFromToday(12),
    },
  },
  {
    label: 'Student short film',
    description: 'Entry-level acting opportunity for testing fresher matching.',
    data: {
      title: 'Ensemble cast for coming-of-age short film',
      description: 'A warm 15-minute college film following four friends through their final day on campus. Seeking natural performers with strong ensemble instincts.',
      category: 'ACTOR',
      experienceLevel: 'FRESHER',
      location: 'Pune, Maharashtra',
      duration: '3 weekend shoot days',
      requirements: 'Playing age 18-24. Hindi or Marathi fluency preferred. No professional credits required; self-tape instructions will be provided.',
      numberOfPositions: 4,
      payInfo: 'Travel, meals, footage, and a modest honorarium provided.',
      languages: ['Hindi', 'Marathi'],
      auditionType: 'FILM',
      workMode: 'ONSITE',
      paymentType: 'HONORARIUM',
      selfTapeEnabled: true,
      selfTapeRequired: true,
      selfTapeInstructions:
        'Record a 60-90 second self-tape introducing yourself and performing a short natural conversation beat. Phone video is fine; prioritize clear audio and light.',
      selfTapeSubmissionTypes: ['link'],
      selfTapeMaxDurationSeconds: 90,
      deadline: dateFromToday(9),
    },
  },
];

export default function NewAuditionPage() {
  const router = useRouter();
  const { user, userType } = useAuth();
  const [form, setForm] = useState<AuditionForm>(emptyAudition);
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
    let selfTapeInstructions = '';
    try {
      selfTapeInstructions = validateSelfTapeInstructions(
        form.selfTapeInstructions
      );
    } catch (validationError: unknown) {
      setError(
        getErrorMessage(validationError, 'Check the self-tape instructions.')
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      await ensureUserAccount(user.uid, user.email, 'RECRUITER');
      const profile = await getRecruiterProfile(user.uid).catch(() => null);
      if (!profile) {
        router.push('/recruiter/profile');
        return;
      }
      const verification = await getRecruiterVerification(user.uid);
      if (verification?.status !== 'approved') {
        router.push('/recruiter/verification');
        return;
      }
      await createAudition(user.uid, {
        ...form,
        selfTapeInstructions,
        selfTapeSubmissionTypes: normalizeSelfTapeSubmissionTypes(
          form.selfTapeEnabled,
          form.selfTapeSubmissionTypes
        ),
        selfTapeMaxDurationSeconds:
          form.selfTapeEnabled && form.selfTapeMaxDurationSeconds
            ? Number(form.selfTapeMaxDurationSeconds)
            : null,
        recruiterName: profile?.companyName ?? user.email ?? 'Recruiter',
        deadline: new Date(form.deadline),
        status,
      });
      router.push('/recruiter/auditions');
    } catch {
      setError('The audition could not be saved. Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const update = (
    key: keyof typeof form,
    value: string | number | boolean | string[] | null
  ) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <AppShell requiredRole="RECRUITER">
      <div className="max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">New casting brief</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl lg:text-4xl">Build a casting call that attracts the right Talent.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
              Clear requirements, honest compensation, and a safe process attract stronger applicants.
              Give Talent enough context to know whether the role truly fits.
            </p>
          </div>
          <div className="border-l-2 border-[#d8a843] pl-4 text-sm">
            <p className="font-bold">Recruiter access</p>
            <p className="mt-1 text-[#657176]">
              {userType === 'RECRUITER' ? 'Approved to publish' : 'Role not detected'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <DevFormPresets
            title="Fill a realistic casting brief, review it, then save as a draft or publish."
            presets={auditionPresets}
            onSelect={(data) => {
              setForm(data);
              setError('');
            }}
            onClear={() => {
              setForm(emptyAudition);
              setError('');
            }}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
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
                  <Input label="Audition title" value={form.title} onChange={(v) => update('title', v)} placeholder="Example: Lead role for a short film" helper="Include the role type and project so Talent can tell at a glance if it fits their profile." />
                </div>
                <label className="block text-sm font-bold">Category<select value={form.category} onChange={(e) => update('category', e.target.value)} className="field mt-2">{Object.entries(CATEGORY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <label className="block text-sm font-bold">Experience level<select value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value)} className="field mt-2">{Object.entries(EXPERIENCE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <Input label="Location" value={form.location} onChange={(v) => update('location', v)} placeholder="Example: Hyderabad or remote" helper="Talent use location to decide whether they can attend in person." />
                <Input label="Project duration" value={form.duration} onChange={(v) => update('duration', v)} placeholder="Example: 3 shoot days in July" helper="Mention expected shoot dates or timeline if known." />
                <label className="block text-sm font-bold">Project type<select value={form.auditionType} onChange={(e) => update('auditionType', e.target.value)} className="field mt-2"><option value="FILM">Film</option><option value="SERIES">Series</option><option value="COMMERCIAL">Commercial</option><option value="THEATRE">Theatre</option><option value="VOICE_OVER">Voice over</option><option value="LIVE_EVENT">Live event</option><option value="OTHER">Other</option></select></label>
                <label className="block text-sm font-bold">Work mode<select value={form.workMode} onChange={(e) => update('workMode', e.target.value)} className="field mt-2"><option value="ONSITE">Onsite</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option></select></label>
                <div className="sm:col-span-2">
                  <Input label="Languages" value={form.languages.join(', ')} onChange={(v) => setForm((current) => ({ ...current, languages: v.split(',').map((item) => item.trim()).filter(Boolean) }))} required={false} placeholder="Hindi, Telugu, English" helper="Comma-separated. Leave blank if the role is open to any language." />
                </div>
              </div>
            </section>

            <section className="surface p-6">
              <p className="eyebrow">02 · Creative brief</p>
              <label className="mt-5 block text-sm font-bold">
                Role description
                <textarea required rows={7} value={form.description} onChange={(e) => update('description', e.target.value)} className="field mt-2" placeholder="Example: Describe the project tone, role, schedule context, and what Talent will perform." />
                <p className="mt-1.5 text-xs font-normal leading-5 text-[#657176]">Talent uses this to decide if the role fits their skills. Include the project context, character brief, and tone.</p>
              </label>
              <label className="mt-5 block text-sm font-bold">
                Requirements
                <textarea required rows={6} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} className="field mt-2" placeholder="Example: Telugu-speaking dancer, available for rehearsals, comfortable with self-tape." />
                <p className="mt-1.5 text-xs font-normal leading-5 text-[#657176]">Be specific but fair. Only list requirements that genuinely affect eligibility.</p>
              </label>
            </section>

            <section className="surface p-6">
              <p className="eyebrow">03 · Self-tape requirements</p>
              <div className="mt-5 space-y-5">
                <label className="flex items-start gap-3 rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-4">
                  <input
                    type="checkbox"
                    checked={form.selfTapeEnabled}
                    onChange={(event) => {
                      update('selfTapeEnabled', event.target.checked);
                      if (!event.target.checked) {
                        setForm((current) => ({
                          ...current,
                          selfTapeRequired: false,
                          selfTapeInstructions: '',
                          selfTapeSubmissionTypes: ['link'],
                          selfTapeMaxDurationSeconds: null,
                        }));
                      }
                    }}
                    className="mt-1 size-4 accent-[#008ca6]"
                  />
                  <span>
                    <span className="block font-black">
                      Request a self-tape from applicants
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[#657176]">
                      Applicants will apply first, then submit their self-tape
                      from My Applications. Self-tapes are visible only to the
                      applicant, audition owner, and admins.
                    </span>
                  </span>
                </label>

                {form.selfTapeEnabled && (
                  <div className="grid gap-5">
                    <fieldset className="grid gap-3 rounded-md border border-[#d8e2e6] p-4 sm:grid-cols-2">
                      <legend className="px-1 text-sm font-black">
                        Requirement level
                      </legend>
                      <label className="flex items-center gap-2 font-bold">
                        <input
                          type="radio"
                          checked={form.selfTapeRequired}
                          onChange={() => update('selfTapeRequired', true)}
                          className="accent-[#008ca6]"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2 font-bold">
                        <input
                          type="radio"
                          checked={!form.selfTapeRequired}
                          onChange={() => update('selfTapeRequired', false)}
                          className="accent-[#008ca6]"
                        />
                        Optional
                      </label>
                    </fieldset>

                    <fieldset className="rounded-md border border-[#d8e2e6] p-4">
                      <legend className="px-1 text-sm font-black">
                        Accepted submission
                      </legend>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center gap-2 font-bold">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="accent-[#008ca6]"
                          />
                          External video link
                        </label>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#657176]">
                        Self-tapes use unlisted or private links from YouTube,
                        Vimeo, or a similar platform.
                      </p>
                    </fieldset>

                    <label className="block text-sm font-bold">
                      Instructions or prompt
                      <textarea
                        value={form.selfTapeInstructions}
                        onChange={(event) =>
                          update('selfTapeInstructions', event.target.value)
                        }
                        maxLength={1200}
                        rows={5}
                        className="field mt-2"
                        placeholder="Example: Record a 60-second introduction and one short scene. Use clear audio, natural light, and an unlisted video link."
                      />
                      <p className="mt-1.5 text-xs font-normal leading-5 text-[#657176]">Do not ask Talent to contact you directly outside Nata Connect or to make any payment to participate.</p>
                    </label>

                    <Input
                      label="Clip duration limit (seconds)"
                      type="number"
                      value={String(form.selfTapeMaxDurationSeconds ?? '')}
                      onChange={(value) =>
                        update(
                          'selfTapeMaxDurationSeconds',
                          value ? Number(value) : null
                        )
                      }
                      required={false}
                      placeholder="Optional, e.g. 90"
                      helper="Optional. For example, 90 means each submission must be 90 seconds or under."
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="surface p-5">
              <p className="eyebrow">04 · Publishing</p>
              <div className="mt-5 space-y-5">
                <Input label="Positions" type="number" value={String(form.numberOfPositions)} onChange={(v) => update('numberOfPositions', Number(v))} />
                <Input label="Application deadline" type="date" value={form.deadline} onChange={(v) => update('deadline', v)} helper="Give Talent at least 7 days to prepare and apply." />
                <Input label="Pay information" value={form.payInfo} onChange={(v) => update('payInfo', v)} required={false} placeholder="Example: Paid day rate, honorarium, or unpaid student project" helper="Specific compensation helps Talent make an informed decision. Mention rates, fees, or honorarium amounts when possible." />
                <label className="block text-sm font-bold">
                  Compensation type
                  <select value={form.paymentType} onChange={(e) => update('paymentType', e.target.value)} className="field mt-2"><option value="PAID">Paid</option><option value="HONORARIUM">Honorarium</option><option value="UNPAID">Unpaid</option><option value="UNSPECIFIED">Not specified</option></select>
                  <p className="mt-1.5 text-xs font-normal leading-5 text-[#657176]">Paid = formal rate; Honorarium = token payment; Unpaid = credit or experience only.</p>
                </label>
              </div>
            </section>
            <section className="rounded-md border border-[#bad7d3] bg-[#edf7f5] p-4 text-sm text-[#234b47]">
              <p className="font-black text-[#123936]">Before you publish</p>
              <ul className="mt-3 space-y-2 leading-5">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#008ca6]">✓</span>
                  <span>Deadline and location are accurate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#008ca6]">✓</span>
                  <span>Pay details and type are specified</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#008ca6]">✓</span>
                  <span>Requirements clearly describe the role</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#e7ad2d]">!</span>
                  <span className="font-bold">Never ask Talent to pay to audition</span>
                </li>
              </ul>
              <p className="mt-3 text-xs leading-5 text-[#3d6862]">
                Published auditions are visible to Talent immediately.
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

function Input({ label, value, onChange, type = 'text', placeholder, required = true, helper }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; helper?: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input type={type} required={required} min={type === 'number' ? 1 : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
      {helper && <p className="mt-1.5 text-xs font-normal leading-5 text-[#657176]">{helper}</p>}
    </label>
  );
}
