import type { ScreeningQuestion, ScreeningAnswer, ScreeningQuestionType } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAX_SCREENING_QUESTIONS = 8;
export const MAX_PROMPT_LENGTH = 180;
export const MAX_HELP_TEXT_LENGTH = 240;
export const MAX_SHORT_ANSWER_LENGTH = 600;
export const MAX_MULTI_CHOICE_SELECTED = 4;
export const MAX_OPTIONS = 6;
export const MAX_OPTION_LENGTH = 80;

const VALID_TYPES: ScreeningQuestionType[] = [
  'short_text',
  'yes_no',
  'single_choice',
  'multi_choice',
];

// ── Label tables ──────────────────────────────────────────────────────────────

export const QUESTION_TYPE_LABELS: Record<ScreeningQuestionType, string> = {
  short_text: 'Short text',
  yes_no: 'Yes / No',
  single_choice: 'Single choice',
  multi_choice: 'Multiple choice',
};

// ── Safety patterns ───────────────────────────────────────────────────────────
// These detect unsafe content that has no place in a professional casting brief.
// Safe casting questions (language, availability, experience, travel) are allowed.

type SafetyPattern = { key: string; pattern: RegExp; label: string };

const UNSAFE_PATTERNS: SafetyPattern[] = [
  {
    key: 'payment_request',
    pattern: /(?:registration|audition|casting|training|joining|processing|advance|security|refundable)\s+fee\b/i,
    label: 'Payment or fee request',
  },
  {
    key: 'payment_request',
    pattern: /\bpay(?:ment)?\s+(?:to\s+(?:join|apply|audition|proceed|register|get\s+the\s+role|be\s+selected)|(?:is\s+)?(?:required|mandatory|needed)\b)/i,
    label: 'Payment request language',
  },
  {
    key: 'payment_request',
    pattern: /\b(?:deposit|advance)\s+(?:required|of\s+(?:rs|₹|\$|inr|\d)|amount)/i,
    label: 'Deposit request',
  },
  {
    key: 'bank_details',
    pattern: /\bbank\s+(?:account|details?|number|transfer)\b/i,
    label: 'Bank details request',
  },
  {
    key: 'otp_password',
    pattern: /\b(?:otp|one[- ]time[- ](?:password|code|pin)|share\s+your\s+password|provide\s+your\s+password|passcode)\b/i,
    label: 'OTP or password request',
  },
  {
    key: 'government_id',
    pattern: /\b(?:aadhaar|aadhar|pan\s+card|pan\s+number|passport\s+number|voter[\s-]?id|driving\s+licen[sc]e\s+number|government[\s-]id\s+number)\b/i,
    label: 'Government ID number request',
  },
  {
    key: 'private_document',
    pattern: /\b(?:send|upload|share|provide|submit|attach)\s+(?:your\s+)?(?:aadhaar|aadhar|pan\s+card|passport\s+copy|id\s+proof|bank\s+statement|salary\s+slip|degree\s+certificate|birth\s+certificate)\b/i,
    label: 'Private document request',
  },
  {
    key: 'off_platform',
    pattern: /\bwhatsapp\b|\btelegram\b|\binstagram\s+dm\b/i,
    label: 'Off-platform contact pressure',
  },
  {
    key: 'off_platform',
    pattern: /(?:contact|reach|message|text|chat)\s+(?:me|us)\s+(?:on|at|via|through|over)\s+(?:whatsapp|telegram|instagram|signal|phone|mobile)/i,
    label: 'Off-platform contact pressure',
  },
  {
    key: 'off_platform',
    pattern: /\boutside\s+(?:the\s+)?(?:app|platform|nata\s+connect)\b/i,
    label: 'Off-platform communication request',
  },
  {
    key: 'medical_data',
    pattern: /\b(?:medical\s+certificate|blood\s+group|health\s+condition|mental\s+health\s+history|pregnant|pregnancy\s+status)\b/i,
    label: 'Sensitive medical data request',
  },
  {
    key: 'political_religious',
    pattern: /\b(?:political\s+(?:party|affiliation|views?)|religious\s+(?:identity|affiliation)|caste\s+(?:certificate|proof)|sect\b)\b/i,
    label: 'Political or religious identity request',
  },
];

function getUnsafeFlags(text: string): string[] {
  const seen = new Set<string>();
  const flags: string[] = [];
  for (const { key, pattern, label } of UNSAFE_PATTERNS) {
    if (!seen.has(key) && pattern.test(text)) {
      seen.add(key);
      flags.push(label);
    }
  }
  return flags;
}

// ── Validation ────────────────────────────────────────────────────────────────

export const validateScreeningQuestion = (
  question: Partial<ScreeningQuestion>
): string | null => {
  const prompt = question.prompt?.trim() ?? '';
  if (!prompt) return 'Question prompt is required.';
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `Question prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.`;
  }
  if (!question.type || !VALID_TYPES.includes(question.type)) {
    return 'Question type must be short_text, yes_no, single_choice, or multi_choice.';
  }
  const helpText = question.helpText?.trim() ?? '';
  if (helpText.length > MAX_HELP_TEXT_LENGTH) {
    return `Help text must be ${MAX_HELP_TEXT_LENGTH} characters or fewer.`;
  }
  if (question.type === 'single_choice' || question.type === 'multi_choice') {
    const options = question.options ?? [];
    if (options.length < 2) return 'Choice questions need at least 2 options.';
    if (options.length > MAX_OPTIONS) {
      return `Choice questions can have at most ${MAX_OPTIONS} options.`;
    }
    for (const option of options) {
      if (!option.trim()) return 'Options cannot be blank.';
      if (option.trim().length > MAX_OPTION_LENGTH) {
        return `Each option must be ${MAX_OPTION_LENGTH} characters or fewer.`;
      }
    }
  }
  const combinedText = [
    question.prompt,
    question.helpText,
    ...(question.options ?? []),
  ]
    .filter(Boolean)
    .join(' ');
  const flags = getUnsafeFlags(combinedText);
  if (flags.length > 0) {
    return `Question contains unsafe language (${flags[0]}). Remove it before adding this question.`;
  }
  return null;
};

export const validateScreeningQuestions = (
  questions: Partial<ScreeningQuestion>[]
): string | null => {
  if (questions.length > MAX_SCREENING_QUESTIONS) {
    return `A casting brief can have at most ${MAX_SCREENING_QUESTIONS} screening questions.`;
  }
  for (const question of questions) {
    const error = validateScreeningQuestion(question);
    if (error) return error;
  }
  return null;
};

export const getScreeningQuestionSafetyFlags = (
  question: Partial<ScreeningQuestion>
): string[] => {
  const combinedText = [
    question.prompt,
    question.helpText,
    ...(question.options ?? []),
  ]
    .filter(Boolean)
    .join(' ');
  return getUnsafeFlags(combinedText);
};

// ── Normalize ─────────────────────────────────────────────────────────────────

export const normalizeScreeningQuestions = (
  questions: Partial<ScreeningQuestion>[]
): ScreeningQuestion[] =>
  questions
    .filter((q) => q.prompt?.trim())
    .slice(0, MAX_SCREENING_QUESTIONS)
    .map((q, index) => ({
      id: q.id ?? `sq_${index}`,
      prompt: (q.prompt ?? '').trim().slice(0, MAX_PROMPT_LENGTH),
      type: VALID_TYPES.includes(q.type as ScreeningQuestionType)
        ? (q.type as ScreeningQuestionType)
        : 'short_text',
      required: q.required === true,
      options: (q.options ?? [])
        .map((o) => o.trim().slice(0, MAX_OPTION_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_OPTIONS),
      helpText: q.helpText?.trim().slice(0, MAX_HELP_TEXT_LENGTH) ?? undefined,
      order: index,
    }));

// ── Checklist ─────────────────────────────────────────────────────────────────

export type ScreeningChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  detail: string;
};

export const getScreeningQuestionChecklist = (
  questions: ScreeningQuestion[]
): ScreeningChecklistItem[] => {
  const allSafe = questions.every(
    (q) => getScreeningQuestionSafetyFlags(q).length === 0
  );
  const allPromptsClear = questions.every((q) => q.prompt.trim().length >= 10);
  return [
    {
      key: 'count',
      label: 'Question count',
      complete: questions.length <= MAX_SCREENING_QUESTIONS,
      detail:
        questions.length === 0
          ? 'No screening questions. Questions are optional.'
          : questions.length > MAX_SCREENING_QUESTIONS
            ? `${questions.length} questions exceeds the limit of ${MAX_SCREENING_QUESTIONS}.`
            : `${questions.length} of ${MAX_SCREENING_QUESTIONS} questions used.`,
    },
    {
      key: 'prompts',
      label: 'Clear prompts',
      complete: questions.length === 0 || allPromptsClear,
      detail:
        questions.length === 0
          ? 'No questions to check.'
          : allPromptsClear
            ? 'All question prompts are specific enough to answer.'
            : 'Some prompts are too short. Make each question clear and role-specific.',
    },
    {
      key: 'safety',
      label: 'No unsafe language',
      complete: allSafe,
      detail: allSafe
        ? 'No unsafe language detected in screening questions.'
        : 'One or more questions may contain unsafe language. Review before publishing.',
    },
  ];
};

// ── Templates ─────────────────────────────────────────────────────────────────

export const getScreeningQuestionTemplates = (): ScreeningQuestion[] => [
  {
    id: 'tpl_dates',
    prompt: 'Are you available for the listed shoot or event dates?',
    type: 'yes_no',
    required: true,
    order: 0,
  },
  {
    id: 'tpl_languages',
    prompt: 'Which languages can you perform in for this role?',
    type: 'short_text',
    required: false,
    helpText: 'List the languages you are comfortable performing in for this specific role.',
    order: 1,
  },
  {
    id: 'tpl_experience',
    prompt: 'Do you have relevant dance, theatre, or acting experience for this role?',
    type: 'yes_no',
    required: false,
    order: 2,
  },
  {
    id: 'tpl_travel',
    prompt: 'Can you travel to or work at the listed location?',
    type: 'yes_no',
    required: true,
    order: 3,
  },
  {
    id: 'tpl_selftape',
    prompt: 'Do you have an external self-tape or showreel link ready to share?',
    type: 'yes_no',
    required: false,
    order: 4,
  },
  {
    id: 'tpl_requirements',
    prompt: 'Are you comfortable with the listed role requirements?',
    type: 'yes_no',
    required: false,
    order: 5,
  },
];

// ── Answer validation ─────────────────────────────────────────────────────────

export const sanitizeScreeningAnswer = (
  answer: ScreeningAnswer
): ScreeningAnswer => {
  if (answer.type === 'short_text' && typeof answer.answer === 'string') {
    return { ...answer, answer: answer.answer.trim().slice(0, MAX_SHORT_ANSWER_LENGTH) };
  }
  if (answer.type === 'yes_no' && typeof answer.answer === 'boolean') {
    return answer;
  }
  if (answer.type === 'single_choice' && typeof answer.answer === 'string') {
    return { ...answer, answer: answer.answer.trim().slice(0, MAX_OPTION_LENGTH) };
  }
  if (answer.type === 'multi_choice' && Array.isArray(answer.answer)) {
    return {
      ...answer,
      answer: (answer.answer as string[])
        .slice(0, MAX_MULTI_CHOICE_SELECTED)
        .map((item) => item.trim().slice(0, MAX_OPTION_LENGTH)),
    };
  }
  return answer;
};

export const validateScreeningAnswers = (
  questions: ScreeningQuestion[],
  answers: ScreeningAnswer[]
): string | null => {
  for (const question of questions) {
    if (!question.required) continue;
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer) return `"${question.prompt.slice(0, 60)}" is required.`;
    const empty =
      (question.type === 'short_text' && typeof answer.answer === 'string' && !answer.answer.trim()) ||
      (question.type === 'yes_no' && typeof answer.answer !== 'boolean') ||
      (question.type === 'single_choice' && typeof answer.answer === 'string' && !answer.answer.trim()) ||
      (question.type === 'multi_choice' && (!Array.isArray(answer.answer) || (answer.answer as string[]).length === 0));
    if (empty) return `"${question.prompt.slice(0, 60)}" requires an answer.`;
  }
  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;
    if (
      answer.type === 'short_text' &&
      typeof answer.answer === 'string' &&
      answer.answer.length > MAX_SHORT_ANSWER_LENGTH
    ) {
      return `Answer must be ${MAX_SHORT_ANSWER_LENGTH} characters or fewer.`;
    }
    if (
      answer.type === 'single_choice' &&
      typeof answer.answer === 'string' &&
      (question.options ?? []).length > 0 &&
      !question.options!.includes(answer.answer)
    ) {
      return `Answer to "${question.prompt.slice(0, 60)}" must match one of the given options.`;
    }
    if (answer.type === 'multi_choice' && Array.isArray(answer.answer)) {
      if ((answer.answer as string[]).length > MAX_MULTI_CHOICE_SELECTED) {
        return `You can select at most ${MAX_MULTI_CHOICE_SELECTED} options.`;
      }
      if ((question.options ?? []).length > 0) {
        for (const selected of answer.answer as string[]) {
          if (!question.options!.includes(selected)) {
            return `One or more selected options are not valid for "${question.prompt.slice(0, 60)}".`;
          }
        }
      }
    }
  }
  return null;
};

// ── Summary ───────────────────────────────────────────────────────────────────

export type ScreeningAnswerSummaryItem = {
  questionId: string;
  prompt: string;
  required: boolean;
  answered: boolean;
  answerDisplay: string;
};

export type ApplicationScreeningSummary = {
  totalQuestions: number;
  answeredCount: number;
  requiredCount: number;
  requiredAnsweredCount: number;
  missingRequired: string[];
  items: ScreeningAnswerSummaryItem[];
  disclaimer: string;
};

const isAnswered = (
  question: ScreeningQuestion,
  answer: ScreeningAnswer | undefined
): boolean => {
  if (!answer) return false;
  if (question.type === 'short_text') {
    return typeof answer.answer === 'string' && answer.answer.trim().length > 0;
  }
  if (question.type === 'yes_no') return typeof answer.answer === 'boolean';
  if (question.type === 'single_choice') {
    return typeof answer.answer === 'string' && answer.answer.trim().length > 0;
  }
  if (question.type === 'multi_choice') {
    return Array.isArray(answer.answer) && (answer.answer as string[]).length > 0;
  }
  return false;
};

const displayAnswer = (
  question: ScreeningQuestion,
  answer: ScreeningAnswer | undefined
): string => {
  if (!answer) return '—';
  if (question.type === 'yes_no') return answer.answer === true ? 'Yes' : 'No';
  if (Array.isArray(answer.answer)) return (answer.answer as string[]).join(', ') || '—';
  return String(answer.answer) || '—';
};

export const getApplicationScreeningSummary = (
  questions: ScreeningQuestion[],
  answers: ScreeningAnswer[]
): ApplicationScreeningSummary => {
  const items: ScreeningAnswerSummaryItem[] = questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const answer = answers.find((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        prompt: q.prompt,
        required: q.required,
        answered: isAnswered(q, answer),
        answerDisplay: displayAnswer(q, answer),
      };
    });
  const requiredCount = questions.filter((q) => q.required).length;
  const requiredAnsweredCount = items.filter((i) => i.required && i.answered).length;
  const missingRequired = items
    .filter((i) => i.required && !i.answered)
    .map((i) => i.prompt);
  return {
    totalQuestions: questions.length,
    answeredCount: items.filter((i) => i.answered).length,
    requiredCount,
    requiredAnsweredCount,
    missingRequired,
    items,
    disclaimer:
      'Screening answers help the recruiter review your application. They do not guarantee selection or casting.',
  };
};

export type RecruiterScreeningReview = {
  hasAnswers: boolean;
  totalQuestions: number;
  answeredCount: number;
  missingRequired: string[];
  items: ScreeningAnswerSummaryItem[];
  reviewNote: string;
};

export const getRecruiterScreeningReview = (
  questions: ScreeningQuestion[],
  answers: ScreeningAnswer[]
): RecruiterScreeningReview => {
  const summary = getApplicationScreeningSummary(questions, answers);
  return {
    hasAnswers: summary.answeredCount > 0,
    totalQuestions: summary.totalQuestions,
    answeredCount: summary.answeredCount,
    missingRequired: summary.missingRequired,
    items: summary.items,
    reviewNote:
      'Screening answers are a reference for your review. They do not constitute automatic ranking or selection.',
  };
};

export const getTalentScreeningGuidance = (
  questions: ScreeningQuestion[]
): string => {
  if (questions.length === 0) return '';
  const requiredCount = questions.filter((q) => q.required).length;
  if (requiredCount === 0) {
    return `This role has ${questions.length} optional screening question${questions.length !== 1 ? 's' : ''}. Your answers help the recruiter review applications. They do not guarantee selection.`;
  }
  if (requiredCount === questions.length) {
    return `This role has ${requiredCount} required screening question${requiredCount !== 1 ? 's' : ''} you must answer before applying. Your answers help the recruiter review applications. They do not guarantee selection.`;
  }
  return `This role has screening questions — ${requiredCount} required and ${questions.length - requiredCount} optional. Required answers are needed before you can apply. They do not guarantee selection.`;
};
