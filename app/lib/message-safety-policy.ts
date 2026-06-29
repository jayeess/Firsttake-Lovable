export type MessageSafetyBand =
  | 'looks_professional'
  | 'review_recommended'
  | 'strong_caution'
  | 'needs_trust_review';

export type MessageSafetySignalStatus = 'ok' | 'attention' | 'warning' | 'caution';

export type MessageSafetySignal = {
  key: string;
  label: string;
  status: MessageSafetySignalStatus;
  detail: string;
};

export type MessageSafetySummary = {
  band: MessageSafetyBand;
  bandLabel: string;
  signals: MessageSafetySignal[];
  flaggedSignals: MessageSafetySignal[];
  hasHighRisk: boolean;
};

const BAND_LABELS: Record<MessageSafetyBand, string> = {
  looks_professional: 'Looks professional',
  review_recommended: 'Review recommended',
  strong_caution: 'Strong caution',
  needs_trust_review: 'Needs trust review',
};

// ── Signal detectors ─────────────────────────────────────────────────────────
// Each returns true only when explicit risk language is present. Patterns are
// contextual — single words like "pay" or "fee" alone do not trigger.

function hasPaymentLanguage(text: string): boolean {
  return [
    /(?:registration|audition|casting|training|joining|processing|advance|security)\s+fee/i,
    /\bpay(?:ment)?\s+(?:to\s+(?:join|apply|audition|continue|proceed|register|get\s+the\s+role)|(?:is\s+)?(?:required|mandatory|needed)\b)/i,
    /\bsend\s+(?:us|me)\s+(?:money|funds?|the\s+amount|payment)\b/i,
    /\bbank\s+account\s+(?:number|details)\b/i,
    /\bpay\s+(?:first|now|before|deposit)\b/i,
    /\bdeposit\s+(?:required|of\s+(?:rs|₹|\$|inr)|amount)/i,
    /\btransfer\s+(?:an?\s+)?amount\b/i,
    /\bpayment\s+(?:required|needed|mandatory|first|before\s+(?:joining|proceeding|we\s+proceed))/i,
  ].some((pattern) => pattern.test(text));
}

function hasOffPlatformPressure(text: string): boolean {
  return [
    /\bwhatsapp\b/i,
    /\btelegram\b/i,
    /\binstagram\s+(?:dm|direct|message)\b/i,
    /\bsignal\s+(?:me|at|number|app)\b/i,
    /(?:contact|reach|message|text|chat)\s+(?:me|us)\s+(?:on|at|via|through|over)\s+(?:whatsapp|telegram|instagram|signal|snapchat|phone|mobile)/i,
    /(?:my|give\s+(?:me|your))\s+(?:whatsapp\s+number|telegram\s+(?:id|handle)|personal\s+(?:phone|mobile|cell|number|email))/i,
    /(?:move|shift|take|continue)\s+(?:this|our)\s+(?:conversation|chat|discussion)\s+(?:off|to\s+(?:whatsapp|telegram|instagram|signal))/i,
    /(?:don'?t|do\s+not)\s+(?:reply|message|write)\s+(?:here|through\s+(?:this|the)\s+(?:app|platform|site))\b/i,
    /\boutside\s+(?:the\s+)?(?:app|platform|nata\s+connect)\b/i,
  ].some((pattern) => pattern.test(text));
}

function hasDocumentRequest(text: string): boolean {
  return [
    /\b(?:aadhar|aadhaar)\b/i,
    /\bpan\s+(?:card|number)\b/i,
    /\bpassport\s+(?:copy|scan|number|details)\b/i,
    /\b(?:voter\s+id|voter\s+card)\b/i,
    /\bdriving\s+li[cs]en[cs]e\s+(?:copy|scan|number)\b/i,
    /\bbank\s+account\s+(?:number|details)\b/i,
    /\b(?:credit|debit)\s+card\s+(?:number|details)\b/i,
    /\bgovernment\s+id\b/i,
    /\baddress\s+proof\b/i,
    /\b(?:income|salary)\s+(?:proof|certificate|slip)\b/i,
  ].some((pattern) => pattern.test(text));
}

function hasGuaranteedRoleLanguage(text: string): boolean {
  return [
    /\bguaranteed?\s+(?:role|casting|selection|job|placement|work|outcome|income|earning)/i,
    /\b100\s*%\s+(?:confirmed?|selected?|guaranteed?|sure)\b/i,
    /\byou\s+(?:are|have\s+been)\s+(?:definitely\s+)?(?:selected?|confirmed?|chosen|cast\s+for)\b/i,
    /\bwe\s+(?:hereby\s+)?confirm\s+(?:your\s+)?(?:selection|casting)\b/i,
    /\bguaranteed?\s+(?:to\s+|you\s+will\s+)(?:get|receive)\s+(?:the\s+)?(?:role|job)\b/i,
    /\bconfirm(?:ing)?\s+(?:your\s+)?(?:selection|role)\s+(?:for|in)\b/i,
  ].some((pattern) => pattern.test(text));
}

function hasUrgencyPressure(text: string): boolean {
  return [
    /\b(?:respond|reply|confirm|decide)\s+(?:now|immediately|urgently|asap|right\s+now|right\s+away)\b/i,
    /\b(?:last|final)\s+(?:chance|opportunity|(?:few\s+)?(?:spots?|slots?))\b/i,
    /\b(?:today|tonight)\s+only\b/i,
    /\b(?:offer|slot|position|opportunity)\s+(?:expires?|ends?|closes?)\s+(?:soon|tonight|today|in\s+\d+\s+(?:hour|minute))/i,
    /\btime\s+is\s+(?:running\s+out|very\s+limited)\b/i,
    /\brespond\s+within\s+\d+\s+(?:minute|hour)s?\b/i,
    /\bdon'?t\s+(?:miss|waste)\s+(?:this\s+)?(?:chance|opportunity)\b/i,
    /\b(?:extremely|very)\s+urgent\b/i,
  ].some((pattern) => pattern.test(text));
}

// ── Signal definitions ────────────────────────────────────────────────────────

type SignalDef = {
  key: string;
  label: string;
  severity: Exclude<MessageSafetySignalStatus, 'ok'>;
  test: (text: string) => boolean;
  detail: string;
  okDetail: string;
};

const SIGNAL_DEFS: SignalDef[] = [
  {
    key: 'payment',
    label: 'Payment language',
    severity: 'caution',
    test: hasPaymentLanguage,
    detail:
      'This message contains language about fees or payments. Legitimate casting calls on Nata Connect never charge Talent to apply, audition, or be shortlisted.',
    okDetail: 'No payment language found.',
  },
  {
    key: 'offPlatform',
    label: 'Off-platform contact pressure',
    severity: 'warning',
    test: hasOffPlatformPressure,
    detail:
      'This message may be asking to move communication off Nata Connect. Keep all casting conversations here where they are linked to the application.',
    okDetail: 'No off-platform contact pressure found.',
  },
  {
    key: 'document',
    label: 'Unrelated document request',
    severity: 'caution',
    test: hasDocumentRequest,
    detail:
      'This message appears to request personal identity or financial documents. Audition applications should not require government IDs, bank details, or financial records.',
    okDetail: 'No unrelated document requests found.',
  },
  {
    key: 'guarantee',
    label: 'Guaranteed role language',
    severity: 'warning',
    test: hasGuaranteedRoleLanguage,
    detail:
      'This message appears to guarantee a casting outcome. Casting decisions cannot be guaranteed in advance — claims like this are a common pressure tactic.',
    okDetail: 'No guaranteed outcome language found.',
  },
  {
    key: 'urgency',
    label: 'Urgency pressure',
    severity: 'attention',
    test: hasUrgencyPressure,
    detail:
      'This message contains urgency language. Review that the pressure is appropriate for the casting context before sending.',
    okDetail: 'No unusual urgency pressure found.',
  },
];

// ── Public helpers ────────────────────────────────────────────────────────────

export const getMessageSafetySignals = (text: string): MessageSafetySignal[] =>
  SIGNAL_DEFS.map(({ key, label, severity, test, detail, okDetail }) => {
    const flagged = test(text);
    const status: MessageSafetySignalStatus = flagged ? severity : 'ok';
    return { key, label, status, detail: flagged ? detail : okDetail };
  });

export const getMessageSafetyBand = (
  signals: MessageSafetySignal[]
): MessageSafetyBand => {
  const flagged = signals.filter((s) => s.status !== 'ok');
  if (flagged.length === 0) return 'looks_professional';
  if (flagged.some((s) => s.status === 'caution')) return 'needs_trust_review';
  if (flagged.some((s) => s.status === 'warning')) return 'strong_caution';
  return 'review_recommended';
};

export const getMessageSafetySummary = (text: string): MessageSafetySummary => {
  const signals = getMessageSafetySignals(text);
  const band = getMessageSafetyBand(signals);
  return {
    band,
    bandLabel: BAND_LABELS[band],
    signals,
    flaggedSignals: signals.filter((s) => s.status !== 'ok'),
    hasHighRisk: band === 'needs_trust_review',
  };
};

export const hasHighRiskMessageLanguage = (text: string): boolean =>
  getMessageSafetySignals(text).some((s) => s.status === 'caution');

export const getSafeConversationReminders = (
  role?: string | null
): string[] => {
  if (role === 'RECRUITER') {
    return [
      'Keep all feedback professional and specific to the role.',
      'Never ask Talent to pay to apply, audition, or be shortlisted.',
      'Avoid requesting personal identity documents or financial details.',
      'Keep scheduling instructions clear and tied to the audition.',
      'Report any applicant behavior that feels unsafe.',
    ];
  }
  return [
    'Keep all casting communication inside Nata Connect.',
    'Legitimate auditions never charge a fee to apply or audition.',
    'Never share personal contact details or financial information in messages.',
    'Verify recruiter context through the audition and their verified profile.',
    'Use the Report button if anything feels unsafe or pressurising.',
  ];
};

export const getSuggestedSafeReplyTemplates = (
  role?: string | null
): Array<{ label: string; template: string }> => {
  if (role === 'RECRUITER') {
    return [
      {
        label: 'Acknowledge application',
        template:
          'Thank you for applying. We will review your profile and be in touch about next steps.',
      },
      {
        label: 'Callback invite',
        template:
          'We would like to invite you for a callback. Please confirm your availability for the dates listed in the audition.',
      },
      {
        label: 'Request self-tape',
        template:
          'Could you share your self-tape link when it is ready? Please submit it through the application page.',
      },
      {
        label: 'Casting decision',
        template:
          'Thank you for your time and interest. We have made our casting decision for this role.',
      },
    ];
  }
  return [
    {
      label: 'Thank you',
      template:
        'Thank you for the update about the role. I will be ready for the next steps.',
    },
    {
      label: 'Confirm availability',
      template:
        'I am available for a callback on the dates mentioned. Please share confirmation details here.',
    },
    {
      label: 'Ask about self-tape',
      template:
        'Could you share more details about the self-tape requirements and submission deadline?',
    },
    {
      label: 'Ask about schedule',
      template:
        'Could you share more details about the shooting schedule and location for this role?',
    },
  ];
};
