'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { EmptyState, ErrorState, LoadingState } from '@/components/async-state';
import { SafetyNotice } from '@/components/product-ui';
import {
  getAuditionById,
  publishAuditionDraft,
  updateAuditionBrief,
  type AuditionBriefInput,
} from '@/app/lib/firestore-service';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type Audition,
  type AuditionType,
  type ExperienceLevel,
  type PaymentType,
  type ScreeningQuestion,
  type ScreeningQuestionType,
  type TalentCategory,
  type WorkMode,
} from '@/app/lib/types';
import {
  MAX_SCREENING_QUESTIONS,
  QUESTION_TYPE_LABELS,
} from '@/app/lib/casting-application-kit-policy';
import { getCastingBriefQuality } from '@/app/lib/casting-brief-quality-policy';
import {
  canRecruiterPublishAudition,
  getAuditionLifecycleBadge,
  getAuditionLifecycleGuidance,
  toAuditionDate,
} from '@/app/lib/audition-lifecycle-policy';
import { getErrorMessage } from '@/app/lib/error-utils';
import { useAuth } from '@/context/auth-context';

type FormState = AuditionBriefInput & {
  deadline: Date;
};

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const fromAudition = (audition: Audition): FormState => ({
  title: audition.title,
  description: audition.description,
  category: audition.category,
  experienceLevel: audition.experienceLevel,
  location: audition.location,
  duration: audition.duration,
  requirements: audition.requirements,
  numberOfPositions: audition.numberOfPositions,
  payInfo: audition.payInfo ?? '',
  languages: audition.languages ?? [],
  auditionType: audition.auditionType ?? 'OTHER',
  workMode: audition.workMode ?? 'ONSITE',
  paymentType: audition.paymentType ?? 'UNSPECIFIED',
  selfTapeEnabled: audition.selfTapeEnabled ?? false,
  selfTapeRequired: audition.selfTapeRequired ?? false,
  selfTapeInstructions: audition.selfTapeInstructions ?? '',
  selfTapeSubmissionTypes: audition.selfTapeSubmissionTypes ?? ['link'],
  selfTapeMaxDurationSeconds: audition.selfTapeMaxDurationSeconds ?? null,
  screeningQuestions: audition.screeningQuestions ?? [],
  deadline: toAuditionDate(audition.deadline) ?? new Date(),
});

export default function EditAuditionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [audition, setAudition] = useState<Audition | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void getAuditionById(id)
      .then((loaded) => {
        setAudition(loaded);
        setForm(loaded ? fromAudition(loaded) : null);
      })
      .catch((err: unknown) =>
        setError(getErrorMessage(err, 'Unable to load audition'))
      )
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  const briefQuality = useMemo(
    () =>
      form && audition
        ? getCastingBriefQuality({
            ...form,
            deadline: form.deadline,
            status: audition.status,
            recruiterVerified: audition.recruiterVerified,
          })
        : null,
    [audition, form]
  );

  const saveBrief = async () => {
    if (!user || !form) return;
    setSaving(true);
    setError('');
    try {
      await updateAuditionBrief(id, user.uid, form);
      router.push('/recruiter/auditions');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'The audition could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const saveAndPublish = async () => {
    if (!user || !form) return;
    setSaving(true);
    setError('');
    try {
      await updateAuditionBrief(id, user.uid, form);
      await publishAuditionDraft(id, user.uid);
      router.push('/recruiter/auditions');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'The audition could not be published.'));
    } finally {
      setSaving(false);
    }
  };

  if (!audition || !form) {
    return (
      <AppShell requiredRole="RECRUITER">
        {loading ? (
          <LoadingState label="Loading the casting brief editor..." />
        ) : error ? (
          <ErrorState
            title="The casting brief could not be loaded"
            message="We could not load this section. Try refreshing the page."
            onRetry={() => {
              setLoading(true);
              setError('');
              setReloadKey((current) => current + 1);
            }}
          />
        ) : (
          <EmptyState
            title="Casting brief not found"
            message="This brief may have been removed, closed by moderation, or created under another account."
            actionHref="/recruiter/auditions"
            actionLabel="Back to my auditions"
          />
        )}
      </AppShell>
    );
  }

  const lifecycleBadge = getAuditionLifecycleBadge(audition);
  const canPublish = canRecruiterPublishAudition({
    ...audition,
    ...form,
    status: 'DRAFT',
  }, new Date(), briefQuality?.band);

  return (
    <AppShell requiredRole="RECRUITER">
      <Link href="/recruiter/auditions" className="text-sm font-bold text-[#008ca6]">
        Back to casting pipeline
      </Link>
      <div className="mt-5 max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Audition lifecycle studio</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              Edit casting brief
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#657176]">
              Update role details, deadline, self-tape instructions, and screening
              questions without touching applicant history.
            </p>
          </div>
          <span
            className={`w-fit rounded-md border px-3 py-1.5 text-xs font-black uppercase ${
              lifecycleBadge.tone === 'success'
                ? 'border-[#9fc9c4] bg-[#edf7f5] text-[#006b60]'
                : lifecycleBadge.tone === 'attention'
                  ? 'border-[#e0c364] bg-[#fdf9eb] text-[#7a5500]'
                  : lifecycleBadge.tone === 'danger'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-[#cdd5da] bg-[#f4f6f7] text-[#4e5e66]'
            }`}
          >
            {lifecycleBadge.label}
          </span>
        </div>

        <div className="mt-5">
          <SafetyNotice title="Applicant-safe editing">
            {getAuditionLifecycleGuidance(audition)} Editing this brief does not
            delete applications, applicant notes, messages, or decision-room history.
          </SafetyNotice>
        </div>

        {error && (
          <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            {error}
          </div>
        )}

        <form
          className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]"
          onSubmit={(event) => {
            event.preventDefault();
            void saveBrief();
          }}
        >
          <div className="space-y-5">
            <section className="surface p-5 sm:p-6">
              <p className="eyebrow">01 Role basics</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Audition title"
                  value={form.title}
                  onChange={(value) => setForm({ ...form, title: value })}
                  className="sm:col-span-2"
                />
                <SelectField
                  label="Category"
                  value={form.category}
                  onChange={(value) =>
                    setForm({ ...form, category: value as TalentCategory })
                  }
                  options={CATEGORY_LABELS}
                />
                <SelectField
                  label="Experience"
                  value={form.experienceLevel}
                  onChange={(value) =>
                    setForm({ ...form, experienceLevel: value as ExperienceLevel })
                  }
                  options={EXPERIENCE_LABELS}
                />
                <TextField
                  label="Location"
                  value={form.location}
                  onChange={(value) => setForm({ ...form, location: value })}
                />
                <TextField
                  label="Duration"
                  value={form.duration}
                  onChange={(value) => setForm({ ...form, duration: value })}
                />
                <SelectField
                  label="Project type"
                  value={form.auditionType ?? 'OTHER'}
                  onChange={(value) =>
                    setForm({ ...form, auditionType: value as AuditionType })
                  }
                  options={{
                    FILM: 'Film',
                    SERIES: 'Series',
                    COMMERCIAL: 'Commercial',
                    THEATRE: 'Theatre',
                    VOICE_OVER: 'Voice over',
                    LIVE_EVENT: 'Live event',
                    OTHER: 'Other',
                  }}
                />
                <SelectField
                  label="Work mode"
                  value={form.workMode ?? 'ONSITE'}
                  onChange={(value) =>
                    setForm({ ...form, workMode: value as WorkMode })
                  }
                  options={{
                    ONSITE: 'Onsite',
                    REMOTE: 'Remote',
                    HYBRID: 'Hybrid',
                  }}
                />
                <TextField
                  label="Languages"
                  value={form.languages?.join(', ') ?? ''}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      languages: value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="sm:col-span-2"
                  required={false}
                />
              </div>
            </section>

            <section className="surface p-5 sm:p-6">
              <p className="eyebrow">02 Creative brief</p>
              <TextAreaField
                label="Role description"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
              <TextAreaField
                label="Requirements"
                value={form.requirements}
                onChange={(value) => setForm({ ...form, requirements: value })}
              />
            </section>

            <section className="surface p-5 sm:p-6">
              <p className="eyebrow">03 Self-tape and screening</p>
              <label className="mt-5 flex items-start gap-3 rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-4 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.selfTapeEnabled ?? false}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      selfTapeEnabled: event.target.checked,
                      selfTapeRequired: event.target.checked
                        ? form.selfTapeRequired
                        : false,
                    })
                  }
                  className="mt-1 size-4 accent-[#008ca6]"
                />
                Request a self-tape link from applicants
              </label>
              {form.selfTapeEnabled && (
                <div className="mt-4 grid gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={form.selfTapeRequired ?? false}
                      onChange={(event) =>
                        setForm({ ...form, selfTapeRequired: event.target.checked })
                      }
                      className="accent-[#008ca6]"
                    />
                    Self-tape required
                  </label>
                  <TextAreaField
                    label="Self-tape instructions"
                    value={form.selfTapeInstructions ?? ''}
                    onChange={(value) =>
                      setForm({ ...form, selfTapeInstructions: value })
                    }
                    required={false}
                  />
                  <TextField
                    label="Duration limit in seconds"
                    type="number"
                    value={String(form.selfTapeMaxDurationSeconds ?? '')}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        selfTapeMaxDurationSeconds: value ? Number(value) : null,
                      })
                    }
                    required={false}
                  />
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black">Screening questions</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        screeningQuestions: [
                          ...(form.screeningQuestions ?? []),
                          {
                            id: crypto.randomUUID(),
                            prompt: '',
                            type: 'short_text',
                            required: false,
                            order: form.screeningQuestions?.length ?? 0,
                          },
                        ],
                      })
                    }
                    disabled={(form.screeningQuestions ?? []).length >= MAX_SCREENING_QUESTIONS}
                    className="secondary-button min-h-10 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Add question
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(form.screeningQuestions ?? []).map((question, index) => (
                    <QuestionEditor
                      key={question.id}
                      index={index}
                      question={question}
                      onChange={(next) =>
                        setForm({
                          ...form,
                          screeningQuestions: (form.screeningQuestions ?? []).map(
                            (item) => (item.id === question.id ? next : item)
                          ),
                        })
                      }
                      onRemove={() =>
                        setForm({
                          ...form,
                          screeningQuestions: (form.screeningQuestions ?? []).filter(
                            (item) => item.id !== question.id
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            {briefQuality && (
              <section className="surface p-5">
                <p className="eyebrow">Publish readiness</p>
                <h2 className="mt-2 text-xl font-black">
                  {briefQuality.bandLabel}
                </h2>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dbe4e8]">
                  <div
                    className="h-full rounded-full bg-[#008ca6]"
                    style={{ width: `${briefQuality.score}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-[#657176]">
                  {briefQuality.score}% ready. Resolve safety warnings before
                  publishing.
                </p>
              </section>
            )}
            <section className="surface p-5">
              <p className="eyebrow">Publishing details</p>
              <div className="mt-5 grid gap-4">
                <TextField
                  label="Positions"
                  type="number"
                  value={String(form.numberOfPositions)}
                  onChange={(value) =>
                    setForm({ ...form, numberOfPositions: Number(value) })
                  }
                />
                <TextField
                  label="Application deadline"
                  type="date"
                  value={toDateInput(form.deadline)}
                  onChange={(value) =>
                    setForm({ ...form, deadline: new Date(value) })
                  }
                />
                <TextField
                  label="Pay information"
                  value={form.payInfo ?? ''}
                  onChange={(value) => setForm({ ...form, payInfo: value })}
                  required={false}
                />
                <SelectField
                  label="Compensation type"
                  value={form.paymentType ?? 'UNSPECIFIED'}
                  onChange={(value) =>
                    setForm({ ...form, paymentType: value as PaymentType })
                  }
                  options={{
                    PAID: 'Paid',
                    HONORARIUM: 'Honorarium',
                    UNPAID: 'Unpaid',
                    UNSPECIFIED: 'Not specified',
                  }}
                />
              </div>
            </section>
            <div className="grid gap-3">
              <button
                type="submit"
                disabled={saving}
                className="primary-button w-full disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              {audition.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={saving || !canPublish}
                  onClick={() => void saveAndPublish()}
                  className="secondary-button w-full disabled:opacity-50"
                >
                  Save and publish
                </button>
              )}
              <Link
                href={`/recruiter/auditions/${audition.id}/applicants`}
                className="secondary-button w-full"
              >
                Open decision room
              </Link>
            </div>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold ${className}`}>
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="mt-5 block text-sm font-bold">
      {label}
      <textarea
        required={required}
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2"
      >
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuestionEditor({
  index,
  question,
  onChange,
  onRemove,
}: {
  index: number;
  question: ScreeningQuestion;
  onChange: (question: ScreeningQuestion) => void;
  onRemove: () => void;
}) {
  const needsOptions =
    question.type === 'single_choice' || question.type === 'multi_choice';

  return (
    <div className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-[#657176]">
          Question {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-black text-red-700 hover:underline"
        >
          Remove
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-bold sm:col-span-2">
          Prompt
          <input
            value={question.prompt}
            onChange={(event) =>
              onChange({ ...question, prompt: event.target.value })
            }
            className="field mt-2"
          />
        </label>
        <SelectField
          label="Type"
          value={question.type}
          onChange={(value) =>
            onChange({
              ...question,
              type: value as ScreeningQuestionType,
              options:
                value === 'single_choice' || value === 'multi_choice'
                  ? question.options?.length
                    ? question.options
                    : ['', '']
                  : undefined,
            })
          }
          options={QUESTION_TYPE_LABELS}
        />
        <label className="mt-8 flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) =>
              onChange({ ...question, required: event.target.checked })
            }
            className="accent-[#008ca6]"
          />
          Required
        </label>
        {needsOptions && (
          <label className="block text-sm font-bold sm:col-span-2">
            Options
            <input
              value={(question.options ?? []).join(', ')}
              onChange={(event) =>
                onChange({
                  ...question,
                  options: event.target.value
                    .split(',')
                    .map((item) => item.trim()),
                })
              }
              className="field mt-2"
              placeholder="Option one, option two"
            />
          </label>
        )}
      </div>
    </div>
  );
}
