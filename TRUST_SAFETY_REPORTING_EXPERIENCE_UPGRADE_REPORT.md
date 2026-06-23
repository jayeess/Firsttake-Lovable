# Trust, Safety and Reporting Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make FirstTake / Nata Connect feel safer and more trustworthy for real casting use. Give Talent practical guidance on scam prevention and reporting, reinforce safe communication across messaging, strengthen admin reports with priority context, and escalate the most dangerous report types to urgent review.

---

## Pages and Files Reviewed

| Page / File | Assessment before this pass |
|---|---|
| `/safety` | Good structure, but CTA pointed to `/beta-feedback`; no specific red-flags section; "How Nata Connect Handles Reports" was vague ("may be reviewed by administrators") |
| `/community-guidelines` | Good coverage; "Reporting Abuse" qualified with "where available"; consequences section had no mention of severity or permanence |
| `/messages` | Page description said "Keep personal contact details private until trust is established" — inconsistent with sidebar's "Never share" policy |
| `/messages/[conversationId]` | `getThreadSafetyReminder` contained "FirstTake" branding (should be "Nata Connect") in both role variants |
| `/admin/reports` | AdminPageHeader description lacked priority guidance; empty state showed same message regardless of filter; reporter note block had no label |
| `app/lib/report-policy.ts` | `scam_or_fraud` and `unsafe_contact_request` were `'high'`; `'urgent'` existed in the type but was unused; `impersonation` and `fake_audition` were `'medium'` despite being fraud-adjacent |
| `/auditions` | SafetyNotice and verified-recruiter MetricCard already present — no changes needed |
| `/auditions/[id]` | SafetyNotice and VerifiedBadge and ReportButton already present — no changes needed |
| `/recruiter/verification` | Updated in Pass 10 — no further changes needed |
| `/t/[slug]` | VerifiedBadge, ReportButton, and casting-inquiry footer already present — no changes needed |

---

## Safety Page Improvements (`app/safety/page.tsx`)

### Header: abstract → practical safety center

**Before:**
```
eyebrow: "User safety"
title: "Safer casting starts with clear boundaries."
description: "Use this guidance before applying, posting, messaging, sharing media, or meeting someone connected to a casting opportunity."
notice: "Nata Connect support is not an emergency service..."
CTA: "Share beta feedback" → /beta-feedback
```

**After:**
```
eyebrow: "Platform safety"
title: "Safer casting, every step."
description: "Practical guidance for Talent, Recruiters, and the public. Know the warning signs, use the platform's safeguards, and report anything that feels unsafe."
notice: "Nata Connect is not an emergency service. If you are in immediate danger, contact local emergency services."
CTA: "Read community guidelines" → /community-guidelines
```

The old CTA pointed to `/beta-feedback` — wrong destination and beta-focused. The new CTA links naturally from Safety to Community Guidelines, completing the trust education flow.

### New section: Red Flags for Fake Casting Calls

**Before:** No dedicated red-flags section.

**After:** Explicit red-flag list — payment at any stage, off-platform pressure, vague roles with high pay, unverifiable production company, upfront document/financial requests, sudden location changes. "When something feels wrong, trust your instincts and report."

This fills the most important gap in the original safety page. Talent need to recognize scam patterns before encountering them.

### Updated sections

| Section | Key change |
|---------|-----------|
| Never Pay to Audition | Strengthened to "at any stage — treat it as a scam" |
| Keep Communication On-Platform | Added: "If someone pressures you to move off-platform, that is a warning sign — report the thread." |
| Verify Recruiter Badges | Reframed as "Verified Recruiter Trust Signals" — explains what the badge means and who verified it |
| Protect Personal Information | Scoped to "in casting conversations" — specific and actionable |
| How to Report | New section explaining the Report button mechanism and reporter confidentiality |
| What Happens After You Report | New section explaining that reports are reviewed, actions taken, and confirmation sent — replaces vague "may be reviewed by administrators" |
| Safe Meeting Reminders | Minor tightening |
| Younger Talent | Was "Younger Users Should Involve a Guardian" — section renamed and tightened |

---

## Community Guidelines Improvements (`app/community-guidelines/page.tsx`)

### Description: passive → standards-setting

**Before:** "These guidelines describe the behavior expected from Talent, Recruiters, and production teams."  
**After:** "These guidelines set the standard for how Talent, Recruiters, and production teams treat each other — and the consequences when those standards are not met."

The old copy was descriptive; the new copy signals that there are real consequences, making the guidelines feel enforceable.

### Reporting Abuse: remove "where available" qualifier

**Before:** "Reports are reviewed by administrators where available."  
**After:** "Reports are reviewed by the Nata Connect trust team and reporter identity is kept confidential. You will receive confirmation when your report is received."

"Where available" implied part-time or optional moderation. The updated copy is confident and adds two key trust signals: confidentiality and confirmation.

### Consequences section: renamed and strengthened

**Before:** "Admin Moderation Actions" — listed possible actions with no mention of severity or permanence.  
**After:** "Consequences of Violations" — same action list with "Serious or repeated violations may result in permanent suspension."

Renaming from "Admin Moderation Actions" to "Consequences of Violations" frames the section from the user's perspective, not the admin's. Adding permanence warning deters repeat abusers.

---

## Messages Inbox Improvements (`app/messages/page.tsx`)

### Description: "until trust is established" → "never"

**Before:** "Keep personal contact details private until trust is established."  
**After:** "Keep all casting communication on-platform — never share personal contact details in messages."

"Until trust is established" implied it eventually becomes acceptable to share contact details in chat — contradicting the sidebar's "Never share personal contact details in chat." The new copy is consistent with the stricter policy.

---

## Conversation Detail Improvements (`app/messages/[conversationId]/page.tsx`)

### `getThreadSafetyReminder`: "FirstTake" → "Nata Connect"

**Before (Recruiter):** "Keep communication on FirstTake and never ask Talent to pay to audition."  
**Before (Talent):** "Keep communication on FirstTake. Do not share sensitive personal documents or payment details in chat."

**After (Recruiter):** "Keep all communication on Nata Connect and never ask Talent to pay to audition."  
**After (Talent):** "Keep all casting communication on Nata Connect. Never share personal contact details or financial information in messages."

"FirstTake" is the repository/project name, not the product name. Every user-facing appearance should read "Nata Connect." This was a branding inconsistency visible in the safety reminder shown on every conversation load.

---

## Admin Reports Page Improvements (`app/admin/reports/page.tsx`)

### AdminPageHeader description: adds priority guidance

**Before:** "Review private abuse reports, inspect minimal evidence, and apply proportionate platform actions. Reporter identity stays inside this administrator workspace."

**After:** "Review private abuse reports, inspect sanitized evidence, and apply proportionate platform actions. Urgent and high priority reports involve fraud, unsafe contact, and harassment — review these first. Reporter identity is kept confidential within this workspace."

Admins now know what the urgency levels mean without leaving the queue page.

### Empty state: filter-aware message

**Before:** "Open safety concerns will appear here as they are submitted." — same message regardless of whether the status filter is 'open', 'resolved', or anything else.

**After:**
- Status = open: "New trust and safety reports will appear here as they are submitted."
- Any other filter: "Try adjusting the status, target type, reason, or priority filter."

Clearer guidance when the queue is empty because of an active filter vs. genuinely empty.

### Reporter note block: label added

**Before:** The amber-bordered block showing `report.reasonText` had no label — admins had to infer it was the reporter's note.

**After:** Added `<p className="mb-2 ...">Reporter note</p>` inside the block.

---

## Report Policy Improvements (`app/lib/report-policy.ts`)

### `getReportPriority`: escalation to `'urgent'`

`ReportPriority = 'low' | 'medium' | 'high' | 'urgent'` — `'urgent'` already existed in the type but was unused.

**Before:**
| Reason | Priority |
|--------|----------|
| scam_or_fraud | high |
| harassment | high |
| unsafe_contact_request | high |
| impersonation | medium |
| inappropriate_content | medium |
| fake_audition | medium |
| spam | low |
| misleading_information | low |
| other | low |

**After:**
| Reason | Priority | Change |
|--------|----------|--------|
| scam_or_fraud | **urgent** | ↑ from high |
| unsafe_contact_request | **urgent** | ↑ from high |
| harassment | high | unchanged |
| impersonation | **high** | ↑ from medium |
| fake_audition | **high** | ↑ from medium |
| inappropriate_content | medium | unchanged |
| misleading_information | medium | ↑ from low |
| spam | low | unchanged |
| other | low | unchanged |

Rationale:
- `scam_or_fraud` → urgent: financial crimes demand immediate review
- `unsafe_contact_request` → urgent: potential physical safety risk
- `impersonation` → high: active fraud, not just content moderation
- `fake_audition` → high: fraud category, same as scam — attracts and deceives Talent
- `misleading_information` → medium: distinguishable from spam; merits human review

The admin reports page already shows urgent/high reports in `danger` tone badges and the priority filter already includes 'urgent'. These escalations are immediately visible in the queue.

### Reporter notification message: more reassuring

**Before:** "Your report was received. Our trust team will review it."  
**After:** "Your report was received and will be reviewed by the trust team. We will follow up if more information is needed."

Adds two pieces of trust-building information: confirmation it will be reviewed, and that the reporter may be contacted. Tests do not assert on this message text.

### Tests updated (`tests/report-policy.test.mts`)

Updated `'priority assignment escalates fraud and unsafe contact reports'` test:
- scam_or_fraud: `'high'` → `'urgent'`
- unsafe_contact_request: `'high'` → `'urgent'`
- Added assertions for harassment (`'high'`), impersonation (`'high'`), fake_audition (`'high'`), misleading_information (`'medium'`)

All 70 tests pass.

---

## What Was Not Changed

| Area | Reason |
|---|---|
| `/auditions` discovery | SafetyNotice and verified-recruiter MetricCard already in place from Pass 8 |
| `/auditions/[id]` detail | SafetyNotice, VerifiedBadge, and ReportButton already strong from Pass 8 |
| `/recruiter/verification` | Just updated in Pass 10 — explains publishing trust and verified badge |
| `/t/[slug]` public profile | VerifiedBadge, ReportButton on profile and media, and casting-inquiry footer already present |
| `components/product-ui.tsx` `SafetyNotice` | Already supports icon prop and branded styling — no changes needed |
| Firestore security rules | No changes — no security impact from this pass |
| Admin permissions | No changes to role gating, admin-only checks, or authentication |
| Report creation API | No changes — schema and validation unchanged |

---

## What Remains for Future Versions

- **Safety education in onboarding** — Talent and Recruiter onboarding flows don't include a safety briefing; a brief safety acceptance step would reduce early-stage scam exposure
- **Proactive scam warning for flagged recruiters** — Talent viewing a brief from a recruiter with open reports could see a caution indicator (requires cross-collection read logic)
- **Report status notifications** — Reporters receive a "report received" notification, but no update when the report is resolved; closing the loop would improve trust
- **Safety education link in casting brief** — the SafetyNotice on `/auditions/[id]` doesn't link to `/safety`; adding a "Learn more" link would help first-time users
- **Urgent report real-time alert** — urgent reports (scam, unsafe contact) appear in the queue but do not push a notification to admins online; a real-time alert would speed up response

---

## Manual Test Checklist

### Safety page (`/safety`)

- [ ] Eyebrow reads "Platform safety"
- [ ] h1 reads "Safer casting, every step."
- [ ] Emergency notice is visible (amber box)
- [ ] Section "Red Flags for Fake Casting Calls" is present with payment, off-platform pressure, and document-request red flags listed
- [ ] Section "Never Pay to Audition" mentions "at any stage"
- [ ] Section "Verified Recruiter Trust Signals" explains what the badge means and who verified it
- [ ] Section "How to Report" explains the Report button and reporter confidentiality
- [ ] Section "What Happens After You Report" confirms the trust team reviews reports and that a notification is sent
- [ ] CTA reads "Read community guidelines" and links to `/community-guidelines`
- [ ] CTA no longer references `/beta-feedback`

### Community guidelines (`/community-guidelines`)

- [ ] Description mentions "consequences when those standards are not met"
- [ ] "Reporting Abuse" section does not say "where available"
- [ ] "Reporting Abuse" mentions trust team review, confidentiality, and confirmation
- [ ] Last section is titled "Consequences of Violations" (not "Admin Moderation Actions")
- [ ] "Consequences" mentions "permanent suspension" for serious or repeated violations

### Messages inbox (`/messages`)

- [ ] Page description reads "Keep all casting communication on-platform — never share personal contact details in messages."
- [ ] Page description no longer says "until trust is established"
- [ ] Inbox habits sidebar still shows "Never share personal contact details in chat." — unchanged

### Conversation detail (`/messages/[conversationId]`)

- [ ] Compose safety reminder (Talent view): reads "Keep all casting communication on Nata Connect. Never share personal contact details or financial information in messages."
- [ ] Compose safety reminder (Recruiter view): reads "Keep all communication on Nata Connect and never ask Talent to pay to audition."
- [ ] Neither variant contains "FirstTake"

### Admin reports (`/admin/reports`)

- [ ] AdminPageHeader description mentions "Urgent and high priority reports involve fraud, unsafe contact, and harassment"
- [ ] Empty state (status = open, no reports): "New trust and safety reports will appear here as they are submitted."
- [ ] Empty state (other filter, no matches): "Try adjusting the status, target type, reason, or priority filter."
- [ ] Reporter note block (when reasonText is present): shows "Reporter note" label above the text
- [ ] Urgent and high reports show `danger` tone badges — unchanged
- [ ] Priority filter includes 'urgent' option — unchanged

### Report priority escalation

- [ ] Submit a report with reason "Scam or fraud" — confirm it appears in the queue with "urgent" priority badge
- [ ] Submit a report with reason "Unsafe contact request" — confirm "urgent" priority
- [ ] Submit a report with reason "Fake audition" — confirm "high" priority (previously medium)
- [ ] Submit a report with reason "Impersonation" — confirm "high" priority (previously medium)
- [ ] Submit a report with reason "Spam" — confirm "low" priority — unchanged

---

## Firebase Deploy Notes

No Firestore rules, indexes, or Cloud Functions were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required for the following changed pages and files:

- `app/safety/page.tsx`
- `app/community-guidelines/page.tsx`
- `app/messages/page.tsx`
- `app/messages/[conversationId]/page.tsx` (compose safety reminder)
- `app/admin/reports/page.tsx`
- `app/lib/report-policy.ts` (consumed by `/api/reports/create` server route)

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/safety/page.tsx` | Edited — eyebrow, title, description, CTA, 9 sections rewritten |
| `app/community-guidelines/page.tsx` | Edited — description, Reporting Abuse body, last section renamed to Consequences |
| `app/messages/page.tsx` | Edited — description removes "until trust is established" qualifier |
| `app/messages/[conversationId]/page.tsx` | Edited — "FirstTake" → "Nata Connect" in getThreadSafetyReminder (both role variants) |
| `app/admin/reports/page.tsx` | Edited — AdminPageHeader description, filter-aware empty state, reporter note label |
| `app/lib/report-policy.ts` | Edited — getReportPriority escalation (scam/unsafe→urgent, impersonation/fake_audition→high, misleading→medium); reporter notification message improved |
| `tests/report-policy.test.mts` | Edited — priority assertions updated to match new mapping; new assertions for harassment, impersonation, fake_audition, misleading_information |
| `TRUST_SAFETY_REPORTING_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
| `CHANGELOG.md` | Updated |
| `TESTING.md` | Updated |
| `PRODUCT_STATUS_AND_ROADMAP.md` | Updated |
| `FULL_APP_UX_POLISH_REPORT.md` | Updated |

---

## Verification Results

```
npm run lint    → ✓ No errors
npm test        → ✓ 70/70 pass
npm run build   → ✓ TypeScript clean, 55 routes generated
git diff --check → ✓ No whitespace errors (CRLF warnings only, expected on Windows)
```
