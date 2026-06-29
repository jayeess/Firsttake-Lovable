import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMessageSafetyBand,
  getMessageSafetySignals,
  getMessageSafetySummary,
  getSafeConversationReminders,
  getSuggestedSafeReplyTemplates,
  hasHighRiskMessageLanguage,
  type MessageSafetySignal,
} from '../app/lib/message-safety-policy.ts';

// ── Signal structure ──────────────────────────────────────────────────────────

test('getMessageSafetySignals returns exactly five signals for any input', () => {
  const signals = getMessageSafetySignals('Hello, please review my application.');
  assert.equal(signals.length, 5);
  const keys = signals.map((s) => s.key);
  assert.ok(keys.includes('payment'));
  assert.ok(keys.includes('offPlatform'));
  assert.ok(keys.includes('document'));
  assert.ok(keys.includes('guarantee'));
  assert.ok(keys.includes('urgency'));
});

test('clean professional message produces all-ok signals', () => {
  const signals = getMessageSafetySignals(
    'Thank you for applying. We will review your profile and follow up with next steps.'
  );
  assert.ok(signals.every((s) => s.status === 'ok'));
});

// ── Payment language (caution) ────────────────────────────────────────────────

test('audition fee phrasing triggers the payment signal', () => {
  const signals = getMessageSafetySignals(
    'There is a small audition fee of ₹500 to register for this role.'
  );
  const payment = signals.find((s) => s.key === 'payment');
  assert.equal(payment?.status, 'caution');
});

test('registration fee triggers payment caution', () => {
  const signals = getMessageSafetySignals('Pay the registration fee before the deadline.');
  assert.equal(signals.find((s) => s.key === 'payment')?.status, 'caution');
});

test('pay now triggers payment caution', () => {
  const signals = getMessageSafetySignals('Please pay now to confirm your slot.');
  assert.equal(signals.find((s) => s.key === 'payment')?.status, 'caution');
});

test('innocuous payment context does not trigger caution', () => {
  const signals = getMessageSafetySignals(
    'We look forward to working with you. No payment is involved in auditions.'
  );
  assert.equal(signals.find((s) => s.key === 'payment')?.status, 'ok');
});

// ── Off-platform pressure (warning) ──────────────────────────────────────────

test('WhatsApp mention triggers off-platform warning', () => {
  const signals = getMessageSafetySignals(
    'Please contact me on WhatsApp at this number for further details.'
  );
  assert.equal(signals.find((s) => s.key === 'offPlatform')?.status, 'warning');
});

test('Telegram mention triggers off-platform warning', () => {
  const signals = getMessageSafetySignals(
    'Reach us on Telegram for faster responses.'
  );
  assert.equal(signals.find((s) => s.key === 'offPlatform')?.status, 'warning');
});

test('move conversation off-platform triggers warning', () => {
  const signals = getMessageSafetySignals(
    "Let's move this conversation outside the app for convenience."
  );
  assert.equal(signals.find((s) => s.key === 'offPlatform')?.status, 'warning');
});

test('no off-platform context leaves the signal ok', () => {
  const signals = getMessageSafetySignals(
    'Looking forward to hearing more about the audition through this platform.'
  );
  assert.equal(signals.find((s) => s.key === 'offPlatform')?.status, 'ok');
});

// ── Document request (caution) ────────────────────────────────────────────────

test('Aadhaar request triggers document caution', () => {
  const signals = getMessageSafetySignals(
    'Please send a copy of your Aadhaar card to proceed.'
  );
  assert.equal(signals.find((s) => s.key === 'document')?.status, 'caution');
});

test('PAN card request triggers document caution', () => {
  const signals = getMessageSafetySignals('We need your PAN card number for our records.');
  assert.equal(signals.find((s) => s.key === 'document')?.status, 'caution');
});

test('government ID request triggers document caution', () => {
  const signals = getMessageSafetySignals('Please submit a valid government ID to confirm.');
  assert.equal(signals.find((s) => s.key === 'document')?.status, 'caution');
});

test('no document request leaves signal ok', () => {
  const signals = getMessageSafetySignals(
    'Please share your self-tape link and portfolio URL when ready.'
  );
  assert.equal(signals.find((s) => s.key === 'document')?.status, 'ok');
});

// ── Guaranteed role language (warning) ───────────────────────────────────────

test('guaranteed role phrase triggers warning', () => {
  const signals = getMessageSafetySignals(
    'We offer a guaranteed role for the right candidate.'
  );
  assert.equal(signals.find((s) => s.key === 'guarantee')?.status, 'warning');
});

test('100 percent selected phrase triggers warning', () => {
  const signals = getMessageSafetySignals('You are 100% selected for the lead part.');
  assert.equal(signals.find((s) => s.key === 'guarantee')?.status, 'warning');
});

test('you have been selected triggers guarantee warning', () => {
  const signals = getMessageSafetySignals(
    'You have been selected for the principal role.'
  );
  assert.equal(signals.find((s) => s.key === 'guarantee')?.status, 'warning');
});

test('standard shortlisting language does not trigger guarantee signal', () => {
  const signals = getMessageSafetySignals(
    'You have been shortlisted and we will be in touch about the next stage.'
  );
  assert.equal(signals.find((s) => s.key === 'guarantee')?.status, 'ok');
});

// ── Urgency pressure (attention) ──────────────────────────────────────────────

test('respond now triggers urgency attention', () => {
  const signals = getMessageSafetySignals('Please respond now to secure your slot.');
  assert.equal(signals.find((s) => s.key === 'urgency')?.status, 'attention');
});

test('last chance phrasing triggers urgency attention', () => {
  const signals = getMessageSafetySignals('This is your last chance to apply for this role.');
  assert.equal(signals.find((s) => s.key === 'urgency')?.status, 'attention');
});

test('today only triggers urgency attention', () => {
  const signals = getMessageSafetySignals('Slots available today only — confirm now.');
  assert.equal(signals.find((s) => s.key === 'urgency')?.status, 'attention');
});

test('normal deadline reminder does not trigger urgency', () => {
  const signals = getMessageSafetySignals(
    'The audition deadline is next Friday. Apply by then if you are interested.'
  );
  assert.equal(signals.find((s) => s.key === 'urgency')?.status, 'ok');
});

// ── Band logic ────────────────────────────────────────────────────────────────

test('all-ok signals produce looks_professional band', () => {
  const signals = getMessageSafetySignals(
    'We are excited to review your portfolio and audition tape.'
  );
  assert.equal(getMessageSafetyBand(signals), 'looks_professional');
});

test('attention-only flags produce review_recommended band', () => {
  const urgencyOnly: MessageSafetySignal[] = [
    { key: 'payment', label: 'Payment', status: 'ok', detail: '' },
    { key: 'offPlatform', label: 'Off-platform', status: 'ok', detail: '' },
    { key: 'document', label: 'Document', status: 'ok', detail: '' },
    { key: 'guarantee', label: 'Guarantee', status: 'ok', detail: '' },
    { key: 'urgency', label: 'Urgency', status: 'attention', detail: '' },
  ];
  assert.equal(getMessageSafetyBand(urgencyOnly), 'review_recommended');
});

test('warning signal without caution produces strong_caution band', () => {
  const withWarning: MessageSafetySignal[] = [
    { key: 'payment', label: 'Payment', status: 'ok', detail: '' },
    { key: 'offPlatform', label: 'Off-platform', status: 'warning', detail: '' },
    { key: 'document', label: 'Document', status: 'ok', detail: '' },
    { key: 'guarantee', label: 'Guarantee', status: 'ok', detail: '' },
    { key: 'urgency', label: 'Urgency', status: 'ok', detail: '' },
  ];
  assert.equal(getMessageSafetyBand(withWarning), 'strong_caution');
});

test('caution signal produces needs_trust_review band regardless of other statuses', () => {
  const withCaution: MessageSafetySignal[] = [
    { key: 'payment', label: 'Payment', status: 'caution', detail: '' },
    { key: 'offPlatform', label: 'Off-platform', status: 'warning', detail: '' },
    { key: 'document', label: 'Document', status: 'ok', detail: '' },
    { key: 'guarantee', label: 'Guarantee', status: 'ok', detail: '' },
    { key: 'urgency', label: 'Urgency', status: 'attention', detail: '' },
  ];
  assert.equal(getMessageSafetyBand(withCaution), 'needs_trust_review');
});

// ── Summary ───────────────────────────────────────────────────────────────────

test('getMessageSafetySummary returns complete shape for clean text', () => {
  const summary = getMessageSafetySummary(
    'Thank you for your interest. We will review your application.'
  );
  assert.equal(summary.band, 'looks_professional');
  assert.equal(summary.bandLabel, 'Looks professional');
  assert.equal(summary.flaggedSignals.length, 0);
  assert.equal(summary.hasHighRisk, false);
  assert.equal(summary.signals.length, 5);
});

test('getMessageSafetySummary marks hasHighRisk for payment language', () => {
  const summary = getMessageSafetySummary(
    'Please pay the audition fee of ₹500 before joining.'
  );
  assert.equal(summary.band, 'needs_trust_review');
  assert.equal(summary.hasHighRisk, true);
  assert.ok(summary.flaggedSignals.some((s) => s.key === 'payment'));
});

test('flaggedSignals contains only non-ok signals', () => {
  const summary = getMessageSafetySummary(
    'Please contact me on WhatsApp to proceed further.'
  );
  assert.ok(summary.flaggedSignals.every((s) => s.status !== 'ok'));
  assert.ok(summary.flaggedSignals.some((s) => s.key === 'offPlatform'));
});

// ── hasHighRiskMessageLanguage ────────────────────────────────────────────────

test('hasHighRiskMessageLanguage is true for payment caution', () => {
  assert.equal(
    hasHighRiskMessageLanguage('Please pay the registration fee before the audition.'),
    true
  );
});

test('hasHighRiskMessageLanguage is true for document caution', () => {
  assert.equal(
    hasHighRiskMessageLanguage('Send us your passport copy to proceed.'),
    true
  );
});

test('hasHighRiskMessageLanguage is false for warning-only text', () => {
  assert.equal(
    hasHighRiskMessageLanguage('Reply now or the slot goes to someone else.'),
    false
  );
});

test('hasHighRiskMessageLanguage is false for clean text', () => {
  assert.equal(
    hasHighRiskMessageLanguage('Looking forward to reviewing your profile.'),
    false
  );
});

// ── Reminders ─────────────────────────────────────────────────────────────────

test('getSafeConversationReminders returns five strings for talent', () => {
  const reminders = getSafeConversationReminders(null);
  assert.equal(reminders.length, 5);
  assert.ok(reminders.every((r) => typeof r === 'string' && r.length > 0));
});

test('getSafeConversationReminders returns five strings for recruiter', () => {
  const reminders = getSafeConversationReminders('RECRUITER');
  assert.equal(reminders.length, 5);
  assert.ok(reminders.every((r) => typeof r === 'string' && r.length > 0));
});

test('recruiter reminders include fee-related guidance', () => {
  const reminders = getSafeConversationReminders('RECRUITER');
  assert.ok(reminders.some((r) => /fee|pay/i.test(r)));
});

test('talent reminders include keep-on-platform guidance', () => {
  const reminders = getSafeConversationReminders(undefined);
  assert.ok(reminders.some((r) => /nata connect|on-platform|platform/i.test(r)));
});

// ── Safe reply templates ──────────────────────────────────────────────────────

test('getSuggestedSafeReplyTemplates returns four templates for talent', () => {
  const templates = getSuggestedSafeReplyTemplates(null);
  assert.equal(templates.length, 4);
  assert.ok(templates.every((t) => t.label && t.template));
});

test('getSuggestedSafeReplyTemplates returns four templates for recruiter', () => {
  const templates = getSuggestedSafeReplyTemplates('RECRUITER');
  assert.equal(templates.length, 4);
  assert.ok(templates.every((t) => t.label && t.template));
});

test('recruiter templates include an application acknowledgement', () => {
  const templates = getSuggestedSafeReplyTemplates('RECRUITER');
  assert.ok(templates.some((t) => /acknowledg|thank.*apply|applying/i.test(t.label + ' ' + t.template)));
});

test('talent templates include an availability confirmation', () => {
  const templates = getSuggestedSafeReplyTemplates('TALENT');
  assert.ok(templates.some((t) => /availab/i.test(t.label + ' ' + t.template)));
});
