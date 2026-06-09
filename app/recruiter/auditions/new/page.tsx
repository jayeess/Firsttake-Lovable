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
import { DevFormPresets } from '@/components/dev-form-presets';
import { hasRecruiterApproval } from '@/app/lib/recruiter-access';

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
    setSaving(true);
    setError('');
    try {
      await ensureUserAccount(user.uid, user.email, 'RECRUITER');
      const profile = await getRecruiterProfile(user.uid).catch(() => null);
      if (!profile) {
        router.push('/recruiter/profile');
        return;
      }
      if (!hasRecruiterApproval(user.uid, profile)) {
        router.push('/recruiter/verification');
        return;
      }
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
    <AppShell requiredRole="RECRUITER">
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
