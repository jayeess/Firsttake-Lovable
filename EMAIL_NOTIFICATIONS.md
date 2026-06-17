# Email Notifications Foundation

Phase 5B adds a safe transactional email foundation for Nata Connect without
requiring real email delivery in beta.

## Current Behavior

- In-app notifications remain the source of truth.
- After an in-app notification is successfully created, the server attempts a
  matching email only for supported transactional events.
- If no provider is configured, the email layer runs in no-op mode and logs a
  safe operational event without exposing recipients, API keys, or message
  bodies.
- Email errors never block the original user action.

## Supported Events

- New message received
- Application shortlisted, selected, or rejected
- Talent self-tape submitted confirmation
- Recruiter self-tape received
- Self-tape reviewed
- Talent or Recruiter verification approved/rejected
- Safety/moderation updates such as content removal, report resolution,
  conversation blocking, public profile moderation, and account suspension

Marketing email is not implemented in this phase.

## Provider Configuration

The adapter is prepared for Resend:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=Nata Connect <notifications@example.com>
EMAIL_REPLY_TO=support@example.com
```

Only variable names belong in documentation or examples. Do not commit real
values.

If `EMAIL_PROVIDER`, `RESEND_API_KEY`, or `EMAIL_FROM` are missing, production
continues safely in no-op mode.

## Templates

Emails are generated from the same privacy-safe notification title, message, and
internal action URL used by in-app notifications. Each email includes:

- Nata Connect product name
- short title
- concise message
- call-to-action link using the configured app URL
- safety footer:
  `For your safety, keep casting communication on Nata Connect and never pay to audition.`

Emails must not include private admin notes, report details, secrets, or raw
credentials.

## Preferences

User documents may contain:

```ts
notificationPreferences?: {
  emailEnabled?: boolean;
  messageEmails?: boolean;
  applicationUpdateEmails?: boolean;
  verificationEmails?: boolean;
  selfTapeEmails?: boolean;
  safetyEmails?: boolean;
  marketingEmails?: boolean;
};
```

Defaults:

- transactional email enabled
- message, application, verification, and self-tape emails enabled
- safety emails enabled
- marketing emails disabled

Talent and Recruiter profile pages include a preferences card. Safety and
account-risk notices remain protected.

## Safe Testing

Local testing does not require provider credentials.

1. Leave `EMAIL_PROVIDER`, `RESEND_API_KEY`, and `EMAIL_FROM` unset.
2. Trigger any supported notification.
3. Confirm the in-app notification appears.
4. Confirm server logs show `email_noop_delivery`.
5. Run `npm test` to cover template, no-op, and preference policy behavior.

## Future Work

- Add provider-specific delivery telemetry.
- Add unsubscribe/preferences links for non-critical categories.
- Add digest or rate-limit support if activity volume grows.
- Add email preview snapshots for design QA.
- Add production monitoring for bounce and complaint rates.
