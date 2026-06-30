import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_SCREENING_QUESTIONS,
  MAX_PROMPT_LENGTH,
  MAX_SHORT_ANSWER_LENGTH,
  MAX_MULTI_CHOICE_SELECTED,
  MAX_OPTIONS,
  getScreeningQuestionSafetyFlags,
  getScreeningQuestionTemplates,
  validateScreeningQuestion,
  validateScreeningQuestions,
  normalizeScreeningQuestions,
  getScreeningQuestionChecklist,
  sanitizeScreeningAnswer,
  validateScreeningAnswers,
  getApplicationScreeningSummary,
  getRecruiterScreeningReview,
  getTalentScreeningGuidance,
} from '../app/lib/casting-application-kit-policy.ts';
import type { ScreeningQuestion, ScreeningAnswer } from '../app/lib/types.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeQuestion = (overrides: Partial<ScreeningQuestion> = {}): ScreeningQuestion => ({
  id: 'q1',
  prompt: 'Are you available for the shoot dates?',
  type: 'yes_no',
  required: true,
  order: 0,
  ...overrides,
});

const makeAnswer = (overrides: Partial<ScreeningAnswer> = {}): ScreeningAnswer => ({
  questionId: 'q1',
  questionPromptSnapshot: 'Are you available for the shoot dates?',
  type: 'yes_no',
  answer: true,
  ...overrides,
});

// ── Safety flags ──────────────────────────────────────────────────────────────

test('getScreeningQuestionSafetyFlags: clean question has no flags', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Are you available for the shoot dates?' });
  assert.equal(flags.length, 0);
});

test('getScreeningQuestionSafetyFlags: detects payment request', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Please pay the registration fee to confirm your audition slot.' });
  assert.ok(flags.length > 0);
  assert.ok(flags.some((f) => f.toLowerCase().includes('payment')));
});

test('getScreeningQuestionSafetyFlags: detects bank details', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Provide your bank account number for processing.' });
  assert.ok(flags.length > 0);
});

test('getScreeningQuestionSafetyFlags: detects off-platform contact', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Contact me on WhatsApp at this number.' });
  assert.ok(flags.length > 0);
});

test('getScreeningQuestionSafetyFlags: detects government ID number request', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Please share your Aadhaar number for verification.' });
  assert.ok(flags.length > 0);
});

test('getScreeningQuestionSafetyFlags: safe availability question passes', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Can you travel to the shoot location in Hyderabad?' });
  assert.equal(flags.length, 0);
});

test('getScreeningQuestionSafetyFlags: safe language question passes', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Which languages can you perform in for this role?' });
  assert.equal(flags.length, 0);
});

test('getScreeningQuestionSafetyFlags: safe experience question passes', () => {
  const flags = getScreeningQuestionSafetyFlags({ prompt: 'Do you have theatre experience?' });
  assert.equal(flags.length, 0);
});

// ── Validate single question ──────────────────────────────────────────────────

test('validateScreeningQuestion: valid yes_no question passes', () => {
  assert.equal(validateScreeningQuestion(makeQuestion()), null);
});

test('validateScreeningQuestion: valid short_text question passes', () => {
  assert.equal(
    validateScreeningQuestion(makeQuestion({ type: 'short_text', required: false })),
    null
  );
});

test('validateScreeningQuestion: missing prompt fails', () => {
  const result = validateScreeningQuestion(makeQuestion({ prompt: '' }));
  assert.ok(typeof result === 'string');
  assert.ok(result.length > 0);
});

test('validateScreeningQuestion: prompt over limit fails', () => {
  const result = validateScreeningQuestion(
    makeQuestion({ prompt: 'A'.repeat(MAX_PROMPT_LENGTH + 1) })
  );
  assert.ok(typeof result === 'string');
});

test('validateScreeningQuestion: invalid type fails', () => {
  const result = validateScreeningQuestion(
    makeQuestion({ type: 'unknown_type' as 'short_text' })
  );
  assert.ok(typeof result === 'string');
});

test('validateScreeningQuestion: choice question with fewer than 2 options fails', () => {
  const result = validateScreeningQuestion(
    makeQuestion({ type: 'single_choice', options: ['Only one'] })
  );
  assert.ok(typeof result === 'string');
});

test('validateScreeningQuestion: choice question with valid options passes', () => {
  const result = validateScreeningQuestion(
    makeQuestion({ type: 'single_choice', options: ['Hindi', 'English'] })
  );
  assert.equal(result, null);
});

test('validateScreeningQuestion: choice question with too many options fails', () => {
  const options = Array.from({ length: MAX_OPTIONS + 1 }, (_, i) => `Option ${i + 1}`);
  const result = validateScreeningQuestion(
    makeQuestion({ type: 'multi_choice', options })
  );
  assert.ok(typeof result === 'string');
});

test('validateScreeningQuestion: unsafe prompt fails', () => {
  const result = validateScreeningQuestion(
    makeQuestion({ prompt: 'Please pay the registration fee to proceed with the audition.' })
  );
  assert.ok(typeof result === 'string');
  assert.ok(result.toLowerCase().includes('unsafe'));
});

// ── Validate multiple questions ────────────────────────────────────────────────

test('validateScreeningQuestions: passes for empty list', () => {
  assert.equal(validateScreeningQuestions([]), null);
});

test('validateScreeningQuestions: passes for valid list under limit', () => {
  const questions = Array.from({ length: 3 }, (_, i) =>
    makeQuestion({ id: `q${i}`, prompt: `Question ${i + 1}: are you available?`, order: i })
  );
  assert.equal(validateScreeningQuestions(questions), null);
});

test('validateScreeningQuestions: fails when over MAX_SCREENING_QUESTIONS', () => {
  const questions = Array.from({ length: MAX_SCREENING_QUESTIONS + 1 }, (_, i) =>
    makeQuestion({ id: `q${i}`, prompt: `Question ${i + 1}: valid prompt`, order: i })
  );
  const result = validateScreeningQuestions(questions);
  assert.ok(typeof result === 'string');
});

// ── Normalize ─────────────────────────────────────────────────────────────────

test('normalizeScreeningQuestions: trims prompts and assigns order', () => {
  const questions = [
    makeQuestion({ id: 'q1', prompt: '  Are you available?  ', order: 99 }),
    makeQuestion({ id: 'q2', prompt: 'Can you travel?', order: 99 }),
  ];
  const result = normalizeScreeningQuestions(questions);
  assert.equal(result[0].prompt, 'Are you available?');
  assert.equal(result[0].order, 0);
  assert.equal(result[1].order, 1);
});

test('normalizeScreeningQuestions: drops questions with empty prompts', () => {
  const questions = [
    makeQuestion({ id: 'q1', prompt: 'Valid question?' }),
    makeQuestion({ id: 'q2', prompt: '   ' }),
  ];
  const result = normalizeScreeningQuestions(questions);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'q1');
});

test('normalizeScreeningQuestions: enforces max count', () => {
  const questions = Array.from({ length: MAX_SCREENING_QUESTIONS + 3 }, (_, i) =>
    makeQuestion({ id: `q${i}`, prompt: `Valid question ${i}` })
  );
  const result = normalizeScreeningQuestions(questions);
  assert.equal(result.length, MAX_SCREENING_QUESTIONS);
});

// ── Checklist ─────────────────────────────────────────────────────────────────

test('getScreeningQuestionChecklist: empty questions all complete', () => {
  const items = getScreeningQuestionChecklist([]);
  assert.ok(items.every((item) => item.complete));
});

test('getScreeningQuestionChecklist: short prompts not complete', () => {
  const questions = [makeQuestion({ prompt: 'Yes?' })];
  const items = getScreeningQuestionChecklist(questions);
  const promptItem = items.find((i) => i.key === 'prompts');
  assert.equal(promptItem?.complete, false);
});

test('getScreeningQuestionChecklist: unsafe question fails safety check', () => {
  const questions = [makeQuestion({ prompt: 'Please provide your bank account number.' })];
  const items = getScreeningQuestionChecklist(questions);
  const safetyItem = items.find((i) => i.key === 'safety');
  assert.equal(safetyItem?.complete, false);
});

// ── Templates ─────────────────────────────────────────────────────────────────

test('getScreeningQuestionTemplates: returns correct count', () => {
  const templates = getScreeningQuestionTemplates();
  assert.equal(templates.length, 6);
});

test('getScreeningQuestionTemplates: all templates pass validation', () => {
  const templates = getScreeningQuestionTemplates();
  for (const template of templates) {
    const result = validateScreeningQuestion(template);
    assert.equal(result, null, `Template "${template.id}" failed: ${result}`);
  }
});

test('getScreeningQuestionTemplates: all templates have unique ids', () => {
  const templates = getScreeningQuestionTemplates();
  const ids = templates.map((t) => t.id);
  assert.equal(ids.length, new Set(ids).size);
});

// ── Sanitize answer ────────────────────────────────────────────────────────────

test('sanitizeScreeningAnswer: trims short_text answer', () => {
  const answer = makeAnswer({
    type: 'short_text',
    answer: '  Hello  ',
  });
  const result = sanitizeScreeningAnswer(answer);
  assert.equal(result.answer, 'Hello');
});

test('sanitizeScreeningAnswer: enforces short_text max length', () => {
  const answer = makeAnswer({
    type: 'short_text',
    answer: 'A'.repeat(MAX_SHORT_ANSWER_LENGTH + 50),
  });
  const result = sanitizeScreeningAnswer(answer);
  assert.equal((result.answer as string).length, MAX_SHORT_ANSWER_LENGTH);
});

test('sanitizeScreeningAnswer: passes through yes_no boolean', () => {
  const answer = makeAnswer({ type: 'yes_no', answer: true });
  const result = sanitizeScreeningAnswer(answer);
  assert.equal(result.answer, true);
});

test('sanitizeScreeningAnswer: limits multi_choice selection count', () => {
  const answer = makeAnswer({
    type: 'multi_choice',
    answer: ['A', 'B', 'C', 'D', 'E'],
  });
  const result = sanitizeScreeningAnswer(answer);
  assert.equal((result.answer as string[]).length, MAX_MULTI_CHOICE_SELECTED);
});

// ── Validate answers ──────────────────────────────────────────────────────────

test('validateScreeningAnswers: passes when all required answered', () => {
  const questions = [makeQuestion({ id: 'q1', required: true })];
  const answers = [makeAnswer({ questionId: 'q1' })];
  assert.equal(validateScreeningAnswers(questions, answers), null);
});

test('validateScreeningAnswers: fails when required question unanswered', () => {
  const questions = [makeQuestion({ id: 'q1', required: true })];
  const result = validateScreeningAnswers(questions, []);
  assert.ok(typeof result === 'string');
});

test('validateScreeningAnswers: passes when optional question unanswered', () => {
  const questions = [makeQuestion({ id: 'q1', required: false })];
  const result = validateScreeningAnswers(questions, []);
  assert.equal(result, null);
});

test('validateScreeningAnswers: fails when short_text exceeds max', () => {
  const questions = [makeQuestion({ id: 'q1', type: 'short_text', required: false })];
  const answers = [makeAnswer({ questionId: 'q1', type: 'short_text', answer: 'A'.repeat(MAX_SHORT_ANSWER_LENGTH + 1) })];
  const result = validateScreeningAnswers(questions, answers);
  assert.ok(typeof result === 'string');
});

test('validateScreeningAnswers: fails when multi_choice exceeds max selected', () => {
  const questions = [
    makeQuestion({ id: 'q1', type: 'multi_choice', required: false, options: ['A', 'B', 'C', 'D', 'E'] }),
  ];
  const answers = [makeAnswer({ questionId: 'q1', type: 'multi_choice', answer: ['A', 'B', 'C', 'D', 'E'] })];
  const result = validateScreeningAnswers(questions, answers);
  assert.ok(typeof result === 'string');
});

test('validateScreeningAnswers: fails when single_choice answer not in options', () => {
  const questions = [
    makeQuestion({ id: 'q1', type: 'single_choice', required: false, options: ['Hindi', 'English'] }),
  ];
  const answers = [makeAnswer({ questionId: 'q1', type: 'single_choice', answer: 'French' })];
  const result = validateScreeningAnswers(questions, answers);
  assert.ok(typeof result === 'string');
});

// ── Application screening summary ─────────────────────────────────────────────

test('getApplicationScreeningSummary: returns correct counts', () => {
  const questions = [
    makeQuestion({ id: 'q1', required: true }),
    makeQuestion({ id: 'q2', required: false, prompt: 'Tell us about your language skills.' }),
  ];
  const answers = [makeAnswer({ questionId: 'q1', answer: true })];
  const summary = getApplicationScreeningSummary(questions, answers);
  assert.equal(summary.totalQuestions, 2);
  assert.equal(summary.answeredCount, 1);
  assert.equal(summary.requiredCount, 1);
  assert.equal(summary.requiredAnsweredCount, 1);
  assert.equal(summary.missingRequired.length, 0);
});

test('getApplicationScreeningSummary: identifies missing required', () => {
  const questions = [makeQuestion({ id: 'q1', required: true, type: 'short_text' })];
  const answers: ScreeningAnswer[] = [];
  const summary = getApplicationScreeningSummary(questions, answers);
  assert.equal(summary.missingRequired.length, 1);
});

test('getApplicationScreeningSummary: yes_no answer displays as Yes or No', () => {
  const questions = [makeQuestion({ id: 'q1' })];
  const answers = [makeAnswer({ questionId: 'q1', answer: true })];
  const summary = getApplicationScreeningSummary(questions, answers);
  assert.equal(summary.items[0].answerDisplay, 'Yes');
});

test('getApplicationScreeningSummary: multi_choice answer joins with comma', () => {
  const questions = [makeQuestion({ id: 'q1', type: 'multi_choice' })];
  const answers = [makeAnswer({ questionId: 'q1', type: 'multi_choice', answer: ['Hindi', 'English'] })];
  const summary = getApplicationScreeningSummary(questions, answers);
  assert.equal(summary.items[0].answerDisplay, 'Hindi, English');
});

test('getApplicationScreeningSummary: unanswered question shows dash', () => {
  const questions = [makeQuestion({ id: 'q1' })];
  const answers: ScreeningAnswer[] = [];
  const summary = getApplicationScreeningSummary(questions, answers);
  assert.equal(summary.items[0].answerDisplay, '—');
});

test('getApplicationScreeningSummary: includes disclaimer', () => {
  const summary = getApplicationScreeningSummary([], []);
  assert.ok(typeof summary.disclaimer === 'string' && summary.disclaimer.length > 0);
});

// ── Recruiter screening review ─────────────────────────────────────────────────

test('getRecruiterScreeningReview: hasAnswers false when no answers', () => {
  const questions = [makeQuestion()];
  const review = getRecruiterScreeningReview(questions, []);
  assert.equal(review.hasAnswers, false);
});

test('getRecruiterScreeningReview: hasAnswers true when at least one answered', () => {
  const questions = [makeQuestion()];
  const answers = [makeAnswer()];
  const review = getRecruiterScreeningReview(questions, answers);
  assert.equal(review.hasAnswers, true);
});

test('getRecruiterScreeningReview: reviewNote clarifies no automatic ranking', () => {
  const review = getRecruiterScreeningReview([], []);
  assert.ok(typeof review.reviewNote === 'string' && review.reviewNote.length > 0);
  // The note must explicitly deny automatic ranking/selection
  assert.ok(
    review.reviewNote.toLowerCase().includes('not') ||
    review.reviewNote.toLowerCase().includes('do not')
  );
});

// ── Talent screening guidance ─────────────────────────────────────────────────

test('getTalentScreeningGuidance: empty for no questions', () => {
  assert.equal(getTalentScreeningGuidance([]), '');
});

test('getTalentScreeningGuidance: mentions required count when mixed', () => {
  const questions = [
    makeQuestion({ required: true }),
    makeQuestion({ id: 'q2', required: false, prompt: 'Another question?' }),
  ];
  const guidance = getTalentScreeningGuidance(questions);
  assert.ok(guidance.includes('1 required'));
  assert.ok(guidance.includes('1 optional'));
});

test('getTalentScreeningGuidance: explicitly denies selection guarantee', () => {
  const questions = [makeQuestion()];
  const guidance = getTalentScreeningGuidance(questions);
  // Policy must explicitly say selection is not guaranteed (uses "do not guarantee" or similar)
  assert.ok(
    guidance.toLowerCase().includes('do not guarantee') ||
    guidance.toLowerCase().includes('not guarantee') ||
    guidance.toLowerCase().includes('no guarantee')
  );
});
