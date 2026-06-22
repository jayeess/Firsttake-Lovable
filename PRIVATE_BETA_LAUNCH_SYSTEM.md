# Private Beta Launch System

**Date:** June 22, 2026
**Status:** Implemented

This document describes the private beta launch features added to Nata Connect to support a small, controlled beta rollout before public launch.

---

## 1. Onboarding Checklists

Role-aware onboarding checklists appear on the dashboard when a user has not yet completed core activation steps.

### Talent checklist (shown when `applications.length === 0`)

| Step | Completion signal |
|------|-------------------|
| Verify your email | `emailVerified === true` |
| Build your talent profile (60%+) | `calculateTalentProfileCompleteness(profile).score >= 60` |
| Browse or save an audition | `savedAuditions.length > 0` |
| Submit your first application | Always pending until first application |

### Recruiter checklist (shown when `auditions.length === 0`)

| Step | Completion signal |
|------|-------------------|
| Verify your email | `emailVerified === true` |
| Complete your company profile | Always pre-completed (dashboard redirects if profile missing) |
| Post your first audition | Always pending until first audition |
| Review applicants | Always pending until first audition |

Both checklists display a `{done}/{total} done` counter and link pending steps directly to the relevant page. Completed steps render with a filled teal circle and strikethrough text. Checklists disappear automatically once the activation condition is met.

---

## 2. Beta Feedback Upgrade

### New type: `performance`

`BETA_FEEDBACK_TYPES` now includes `'performance'` for slow or unresponsive flows. Label: "Performance issue — slow or unresponsive".

### New field: `severity`

```typescript
export const BETA_FEEDBACK_SEVERITIES = ['low', 'medium', 'high', 'blocking'] as const;
export type BetaFeedbackSeverity = (typeof BETA_FEEDBACK_SEVERITIES)[number];
```

| Value | Meaning |
|-------|---------|
| `low` | Minor, does not block the user |
| `medium` | Noticeable, slows the user down (default) |
| `high` | Serious, hard to work around |
| `blocking` | Cannot continue without a fix |

Severity defaults to `'medium'` for unknown/missing values. It is stored in Firestore alongside every feedback submission.

### Form changes (`app/beta-feedback/page.tsx`)

- Added severity dropdown with descriptive labels
- Updated type dropdown labels (e.g. "Bug — something is broken")
- Added private beta trust copy: "Private beta — controlled rollout. You are part of a small trusted group testing the platform before public launch."
- Improved textarea placeholder to mention steps to reproduce

### Admin review page (`app/admin/beta-feedback/page.tsx`)

- Added `Blocking` metric card (count of blocking-severity items)
- Added **Type** filter select alongside the existing Status filter
- Severity badge added to each feedback card with color coding:
  - `blocking` → danger (red)
  - `high` → attention (amber)
  - `medium` → neutral (grey)
  - `low` → muted
- Feedback list sorted by severity (blocking first)
- Type labels humanized: "Bug", "Confusing flow", "Performance", "Safety concern", etc.

---

## 3. Private Beta Copy

### Signup page (`app/auth/signup/page.tsx`)

A compact notice above the form reads:

> **Private beta — controlled rollout.** You are joining a small trusted group. Your feedback shapes what ships next. [Share feedback →]

This is informational only — no invite code gating, no hard blocking.

---

## 4. Admin Beta Operations Card

The admin dashboard (`app/admin/page.tsx`) includes a "Beta control center" card linking to:

| Link | Purpose |
|------|---------|
| `/admin/beta-feedback` | Review all tester feedback |
| `/admin/beta-readiness` | Check launch blockers and env readiness |
| `/admin/audit-logs` | Full privileged action log |
| `/admin/reports` | Safety and trust reports from beta users |

---

## 5. Files Changed

| File | Change |
|------|--------|
| `app/lib/beta-feedback-policy.ts` | Added `performance` type, `BETA_FEEDBACK_SEVERITIES`, `BetaFeedbackSeverity` type, severity validation |
| `app/api/beta-feedback/route.ts` | Accepts and stores `severity` field |
| `app/beta-feedback/page.tsx` | Severity dropdown, updated type labels, private beta copy |
| `app/admin/beta-feedback/page.tsx` | Type filter, severity badges, sort by severity, blocking metric card |
| `app/dashboard/page.tsx` | `TalentOnboardingChecklist` and `RecruiterOnboardingChecklist` components |
| `app/auth/signup/page.tsx` | Private beta trust notice above signup form |
| `app/admin/page.tsx` | Beta control center card with 4 operational links |
| `tests/beta-feedback-policy.test.mts` | Tests for `performance` type and severity default behavior |

---

## 6. Security and Constraints

- No invite code gating or hard user blocking introduced
- No payment, billing, or subscription features
- No AI matching or paid plan features
- No Firebase Storage or document upload changes
- No admin security weakened
- Severity is server-validated; unknown values default to `'medium'` silently
