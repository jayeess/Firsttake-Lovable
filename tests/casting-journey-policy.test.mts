import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCastingJourneySteps,
  getJourneyCurrentStage,
  getJourneyNextStep,
  getApplicationProofChecklist,
  getApplicationProofReceipt,
  getTalentJourneyGuidance,
  getRecruiterJourneySummary,
} from '../app/lib/casting-journey-policy.ts';
import type { Application, Audition } from '../app/lib/types.ts';

const baseApplication = (overrides: Partial<Application> = {}): Application => ({
  id: 'app-1',
  auditionId: 'audition-1',
  talentId: 'talent-1',
  status: 'APPLIED',
  recruiterStatus: null,
  createdAt: new Date('2026-06-01T10:00:00Z'),
  coverMessage: '',
  selfTapeSubmission: undefined,
  selfTapeReviewedAt: undefined,
  reviewedAt: undefined,
  shortlistedAt: undefined,
  rejectedAt: undefined,
  selectedAt: undefined,
  statusHistory: [],
  ...overrides,
});

const baseAudition = (overrides: Partial<Audition> = {}): Audition => ({
  id: 'audition-1',
  recruiterId: 'recruiter-1',
  recruiterName: 'Northstar Motion Pictures',
  title: 'Supporting actor for bilingual drama',
  description: 'A screen role for a bilingual drama production.',
  category: 'ACTOR',
  experienceLevel: '1_3_YRS',
  location: 'Mumbai, Maharashtra',
  duration: '5 shoot days',
  requirements: 'Screen acting, Hindi, English.',
  numberOfPositions: 2,
  languages: ['Hindi', 'English'],
  deadline: new Date('2026-07-15T00:00:00Z'),
  status: 'ACTIVE',
  applicantCount: 0,
  selfTapeEnabled: false,
  selfTapeRequired: false,
  ...overrides,
});

// ── getCastingJourneySteps ────────────────────────────────────────────────────

test('journey steps: fresh APPLIED application has submitted as completed', () => {
  const steps = getCastingJourneySteps(baseApplication());
  const submitted = steps.find((s) => s.key === 'submitted');
  assert.ok(submitted, 'submitted step should exist');
  assert.equal(submitted.status, 'completed');
});

test('journey steps: no cover message shows cover_message as skipped', () => {
  const steps = getCastingJourneySteps(baseApplication({ coverMessage: '' }));
  const coverStep = steps.find((s) => s.key === 'cover_message');
  assert.ok(coverStep);
  assert.equal(coverStep.status, 'skipped');
});

test('journey steps: cover message included shows cover_message as completed', () => {
  const steps = getCastingJourneySteps(
    baseApplication({ coverMessage: 'I am very interested in this role.' })
  );
  const coverStep = steps.find((s) => s.key === 'cover_message');
  assert.ok(coverStep);
  assert.equal(coverStep.status, 'completed');
});

test('journey steps: self_tape step absent when audition has selfTapeEnabled false', () => {
  const steps = getCastingJourneySteps(baseApplication(), baseAudition({ selfTapeEnabled: false }));
  assert.ok(!steps.find((s) => s.key === 'self_tape'));
});

test('journey steps: self_tape step present when audition has selfTapeEnabled true', () => {
  const steps = getCastingJourneySteps(
    baseApplication(),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: false })
  );
  assert.ok(steps.find((s) => s.key === 'self_tape'));
});

test('journey steps: required self_tape not submitted shows pending', () => {
  const steps = getCastingJourneySteps(
    baseApplication({ selfTapeSubmission: undefined }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  const selfTapeStep = steps.find((s) => s.key === 'self_tape');
  assert.ok(selfTapeStep);
  assert.equal(selfTapeStep.status, 'pending');
});

test('journey steps: submitted self_tape shows completed', () => {
  const steps = getCastingJourneySteps(
    baseApplication({
      selfTapeSubmission: {
        url: 'https://youtube.com/watch?v=demo',
        submittedAt: new Date('2026-06-02T10:00:00Z'),
      },
    }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  const selfTapeStep = steps.find((s) => s.key === 'self_tape');
  assert.ok(selfTapeStep);
  assert.equal(selfTapeStep.status, 'completed');
});

test('journey steps: VIEWED status shows opened as completed', () => {
  const steps = getCastingJourneySteps(baseApplication({ recruiterStatus: 'VIEWED' }));
  const opened = steps.find((s) => s.key === 'opened');
  assert.ok(opened);
  assert.equal(opened.status, 'completed');
});

test('journey steps: SHORTLISTED shows shortlisted step as current', () => {
  const steps = getCastingJourneySteps(
    baseApplication({ recruiterStatus: 'SHORTLISTED', shortlistedAt: new Date() })
  );
  const shortlisted = steps.find((s) => s.key === 'shortlisted');
  assert.ok(shortlisted);
  assert.equal(shortlisted.status, 'current');
});

test('journey steps: SELECTED adds selected terminal step as completed', () => {
  const steps = getCastingJourneySteps(
    baseApplication({ recruiterStatus: 'SELECTED', selectedAt: new Date() })
  );
  const selected = steps.find((s) => s.key === 'selected');
  assert.ok(selected);
  assert.equal(selected.status, 'completed');
});

test('journey steps: REJECTED adds not_selected terminal step', () => {
  const steps = getCastingJourneySteps(
    baseApplication({ recruiterStatus: 'REJECTED', rejectedAt: new Date() })
  );
  const notSelected = steps.find((s) => s.key === 'not_selected');
  assert.ok(notSelected);
  assert.equal(notSelected.status, 'completed');
});

test('journey steps: WITHDRAWN adds withdrawn terminal step', () => {
  const steps = getCastingJourneySteps(baseApplication({ status: 'WITHDRAWN' }));
  const withdrawn = steps.find((s) => s.key === 'withdrawn');
  assert.ok(withdrawn);
  assert.equal(withdrawn.status, 'completed');
});

test('journey steps: MAYBE treated same milestone rank as UNDER_REVIEW', () => {
  const steps = getCastingJourneySteps(baseApplication({ recruiterStatus: 'MAYBE' }));
  const opened = steps.find((s) => s.key === 'opened');
  assert.ok(opened);
  assert.equal(opened.status, 'completed');
});

// ── getJourneyCurrentStage ────────────────────────────────────────────────────

test('getJourneyCurrentStage returns status and label for APPLIED', () => {
  const stage = getJourneyCurrentStage(baseApplication());
  assert.equal(stage.status, 'APPLIED');
  assert.ok(stage.label.length > 0);
  assert.ok(stage.detail.length > 0);
});

test('getJourneyCurrentStage returns SHORTLISTED for recruiterStatus SHORTLISTED', () => {
  const stage = getJourneyCurrentStage(
    baseApplication({ recruiterStatus: 'SHORTLISTED' })
  );
  assert.equal(stage.status, 'SHORTLISTED');
});

// ── getJourneyNextStep ────────────────────────────────────────────────────────

test('getJourneyNextStep surfaces self-tape prompt when required and not submitted', () => {
  const nextStep = getJourneyNextStep(
    baseApplication({ selfTapeSubmission: undefined }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  assert.ok(nextStep.toLowerCase().includes('self-tape'));
});

test('getJourneyNextStep returns standard guidance when self-tape already submitted', () => {
  const nextStep = getJourneyNextStep(
    baseApplication({
      selfTapeSubmission: { url: 'https://youtube.com/watch?v=demo', submittedAt: new Date() },
    }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  assert.ok(typeof nextStep === 'string' && nextStep.length > 0);
  assert.ok(!nextStep.toLowerCase().includes('submit your required'));
});

// ── getApplicationProofChecklist ──────────────────────────────────────────────

test('proof checklist: profile always included', () => {
  const checklist = getApplicationProofChecklist(baseApplication());
  const profile = checklist.find((i) => i.key === 'profile');
  assert.ok(profile);
  assert.equal(profile.included, true);
});

test('proof checklist: cover message not included when empty', () => {
  const checklist = getApplicationProofChecklist(baseApplication({ coverMessage: '' }));
  const cover = checklist.find((i) => i.key === 'cover_message');
  assert.ok(cover);
  assert.equal(cover.included, false);
});

test('proof checklist: cover message included when present', () => {
  const checklist = getApplicationProofChecklist(
    baseApplication({ coverMessage: 'Excited about this role.' })
  );
  const cover = checklist.find((i) => i.key === 'cover_message');
  assert.ok(cover);
  assert.equal(cover.included, true);
});

test('proof checklist: self_tape item absent when selfTapeEnabled false', () => {
  const checklist = getApplicationProofChecklist(
    baseApplication(),
    baseAudition({ selfTapeEnabled: false })
  );
  assert.ok(!checklist.find((i) => i.key === 'self_tape'));
});

test('proof checklist: self_tape item present and not included when enabled but not submitted', () => {
  const checklist = getApplicationProofChecklist(
    baseApplication({ selfTapeSubmission: undefined }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  const selfTape = checklist.find((i) => i.key === 'self_tape');
  assert.ok(selfTape);
  assert.equal(selfTape.included, false);
});

test('proof checklist: self_tape included when url submitted', () => {
  const checklist = getApplicationProofChecklist(
    baseApplication({
      selfTapeSubmission: { url: 'https://youtube.com/watch?v=demo', submittedAt: new Date() },
    }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  const selfTape = checklist.find((i) => i.key === 'self_tape');
  assert.ok(selfTape);
  assert.equal(selfTape.included, true);
});

// ── getApplicationProofReceipt ────────────────────────────────────────────────

test('proof receipt includes disclaimer without legal guarantee language', () => {
  const receipt = getApplicationProofReceipt(baseApplication(), baseAudition());
  assert.ok(receipt.disclaimer.toLowerCase().includes('not a casting guarantee'));
  assert.ok(!receipt.disclaimer.toLowerCase().includes('legal certificate'));
  assert.ok(!receipt.disclaimer.toLowerCase().includes('guarantee of selection'));
});

test('proof receipt has audition title and recruiter name', () => {
  const receipt = getApplicationProofReceipt(baseApplication(), baseAudition());
  assert.equal(receipt.auditionTitle, 'Supporting actor for bilingual drama');
  assert.equal(receipt.recruiterName, 'Northstar Motion Pictures');
});

test('proof receipt pack items lists only included items', () => {
  const receipt = getApplicationProofReceipt(
    baseApplication({ coverMessage: 'Great opportunity.' }),
    baseAudition()
  );
  assert.ok(receipt.packItems.includes('Profile snapshot'));
  assert.ok(receipt.packItems.includes('Cover message'));
});

test('proof receipt selfTapeUrl undefined when no self-tape submitted', () => {
  const receipt = getApplicationProofReceipt(baseApplication(), baseAudition());
  assert.equal(receipt.selfTapeUrl, undefined);
});

test('proof receipt selfTapeUrl present when self-tape submitted', () => {
  const receipt = getApplicationProofReceipt(
    baseApplication({
      selfTapeSubmission: { url: 'https://youtube.com/watch?v=demo', submittedAt: new Date() },
    }),
    baseAudition({ selfTapeEnabled: true })
  );
  assert.equal(receipt.selfTapeUrl, 'https://youtube.com/watch?v=demo');
});

// ── getTalentJourneyGuidance ──────────────────────────────────────────────────

test('talent guidance returns headline, detail, nextStep, safetyReminder', () => {
  const guidance = getTalentJourneyGuidance(baseApplication(), baseAudition());
  assert.ok(guidance.headline.length > 0);
  assert.ok(guidance.detail.length > 0);
  assert.ok(guidance.nextStep.length > 0);
  assert.ok(guidance.safetyReminder.length > 0);
});

test('talent guidance SELECTED status includes payment safety reminder', () => {
  const guidance = getTalentJourneyGuidance(
    baseApplication({ recruiterStatus: 'SELECTED' }),
    baseAudition()
  );
  assert.ok(guidance.safetyReminder.toLowerCase().includes('pay'));
});

// ── getRecruiterJourneySummary ────────────────────────────────────────────────

test('recruiter summary: submittedDate populated from createdAt', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication({ createdAt: new Date('2026-06-01T10:00:00Z') }),
    baseAudition()
  );
  assert.ok(summary.submittedDate.includes('2026') || summary.submittedDate.includes('Jun'));
});

test('recruiter summary: selfTapeStatus not requested when selfTapeEnabled false', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication(),
    baseAudition({ selfTapeEnabled: false })
  );
  assert.equal(summary.selfTapeStatus, 'Not requested for this role');
});

test('recruiter summary: selfTapeStatus required not submitted when enabled required and no url', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication({ selfTapeSubmission: undefined }),
    baseAudition({ selfTapeEnabled: true, selfTapeRequired: true })
  );
  assert.equal(summary.selfTapeStatus, 'Required — not yet submitted');
});

test('recruiter summary: selfTapeStatus submitted awaiting review when url present but not reviewed', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication({
      selfTapeSubmission: { url: 'https://youtube.com/watch?v=demo', submittedAt: new Date() },
      selfTapeReviewedAt: undefined,
    }),
    baseAudition({ selfTapeEnabled: true })
  );
  assert.equal(summary.selfTapeStatus, 'Submitted — awaiting review');
});

test('recruiter summary: selfTapeStatus submitted and reviewed when both set', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication({
      selfTapeSubmission: { url: 'https://youtube.com/watch?v=demo', submittedAt: new Date() },
      selfTapeReviewedAt: new Date(),
    }),
    baseAudition({ selfTapeEnabled: true })
  );
  assert.equal(summary.selfTapeStatus, 'Submitted and reviewed');
});

test('recruiter summary: hasCoverMessage false when no message', () => {
  const summary = getRecruiterJourneySummary(baseApplication({ coverMessage: '' }), baseAudition());
  assert.equal(summary.hasCoverMessage, false);
});

test('recruiter summary: hasCoverMessage true when message present', () => {
  const summary = getRecruiterJourneySummary(
    baseApplication({ coverMessage: 'Excited to audition.' }),
    baseAudition()
  );
  assert.equal(summary.hasCoverMessage, true);
});

test('recruiter summary: packReadiness includes profile snapshot', () => {
  const summary = getRecruiterJourneySummary(baseApplication(), baseAudition());
  assert.ok(summary.packReadiness.includes('Profile snapshot'));
});

test('recruiter summary: safetyNote is guidance-only and does not use first-person guarantee claims', () => {
  const summary = getRecruiterJourneySummary(baseApplication(), baseAudition());
  assert.ok(summary.safetyNote.length > 0);
  // The note warns against communicating guarantees — it must not itself make one
  assert.ok(!summary.safetyNote.toLowerCase().includes('you are selected'));
  assert.ok(!summary.safetyNote.toLowerCase().includes('role is confirmed'));
});
