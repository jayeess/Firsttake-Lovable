# Core Application Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make the core Talent and Recruiter product experience feel like a serious, premium casting platform — not a private beta prototype.

---

## Summary of Changes

### 1. Audition Detail Page (`app/auditions/[id]/page.tsx`) — Major overhaul

The most-used Talent page in the product flow. Previously it used raw inline styles that were inconsistent with every other page in the app. Now it matches the brand system end-to-end.

**What changed:**

| Area | Before | After |
|------|--------|-------|
| Article container | `border border-[#d9dee5] bg-white p-6` | `surface p-5 sm:p-6` |
| Aside container | `border border-[#d9dee5] bg-white p-5` | `surface h-fit p-5` |
| Back link | `text-sm font-semibold text-[#1f5f91]` | `text-sm font-bold text-[#008ca6]` + ← arrow |
| Recruiter byline | `font-semibold text-[#1f5f91]` | `text-sm font-black uppercase tracking-wide text-[#008ca6]` |
| Role title | `text-3xl font-bold` | `text-2xl font-black leading-tight sm:text-3xl` |
| Apply button | Hardcoded `h-12 bg-[#008ca6] font-semibold` | `primary-button` class (consistent with all buttons) |
| Save button | No `rounded-md` | `rounded-md` added |
| Section headings | `text-xl font-bold` | `text-xl font-black` |
| Detail labels | `text-xs font-bold text-[#78838e]` | `text-[10px] font-black tracking-wide text-[#7b8a90]` |
| Detail values | `font-semibold` | `font-black text-[#07111f]` |
| Detail grid | 6 fields (Category, Experience, Location, Deadline, Duration, Positions) | Up to 10 fields — adds Project type, Work mode, Compensation, Languages (conditional) |
| Apply error | Bare `<p className="text-sm text-red-700">` | Styled amber block: `rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900` |
| Safety notice | None | `<SafetyNotice title="Never pay to audition">` added below all content |

**New label constants added** (local to file, no shared-state impact):
- `AUDITION_TYPE_LABELS` — Film, Series, Commercial, Theatre, Voice over, Live event, Other
- `WORK_MODE_LABELS` — Onsite, Remote, Hybrid
- `PAYMENT_LABELS` — Paid, Honorarium, Unpaid (UNSPECIFIED is suppressed)

---

### 2. Applications Page (`app/applications/page.tsx`) — Error/empty state consistency

**What changed:**

| Area | Before | After |
|------|--------|-------|
| Error state | Custom inline amber `<div>` with hardcoded styles | `<ErrorState>` component from `async-state.tsx` — consistent with all other error states |
| Empty state | Custom inline dashed-border `<div>` with inline `<Link>` | `<EmptyState>` component with `actionHref`/`actionLabel` props |
| Application byline | `recruiterName - Applied date` (informal dash) | `recruiterName · Applied date` (mid-dot separator) |
| Status filter description | "Use this when you need one exact internal status." (internal developer copy) | "Narrow results to a specific pipeline stage." (user-facing product copy) |

---

### 3. Dashboard (`app/dashboard/page.tsx`) — Remove beta language

**What changed:**

| Component | Before | After |
|-----------|--------|-------|
| `TalentOnboardingChecklist` eyebrow | "Private beta — getting started" | "Getting started" |
| `RecruiterOnboardingChecklist` eyebrow | "Private beta — getting started" | "Getting started" |

The onboarding checklists are permanent product guidance, not beta-specific instructions. Removing the beta qualifier makes them permanent and professional.

---

### 4. Recruiter New Audition (`app/recruiter/auditions/new/page.tsx`) — Self-tape copy

**What changed:**

| Area | Before | After |
|------|--------|-------|
| Self-tape submission type note | "For beta safety, self-tapes use unlisted/private links from trusted video platforms." | "Self-tapes use unlisted or private links from YouTube, Vimeo, or a similar platform." |

The old copy framed a permanent platform decision as a temporary beta restriction. The new copy states it as product policy.

---

### 5. Messages Page (`app/messages/page.tsx`) — Inbox copy

**What changed:**

| Area | Before | After |
|------|--------|-------|
| Page eyebrow | "Private casting communication" | "Casting inbox" |

"Private casting communication" is a technical description. "Casting inbox" is the user mental model.

---

## What Was Not Changed

- No Firestore rules, APIs, authentication, payment, storage, AI, or document upload features added
- No security weakening
- No `.env`, `.env.local`, `node_modules`, `.next`, or service account files touched
- No automatic commits
- No new routes, new data models, or new API endpoints
- Existing uncommitted changes were preserved (no `git restore` or `git checkout`)

---

## Verification

```
npm run lint    → ✓ No errors
npm test        → ✓ 70/70 pass
npm run build   → ✓ TypeScript clean, 55 routes generated
```

---

## Files Changed

| File | Type |
|------|------|
| `app/auditions/[id]/page.tsx` | Edited — comprehensive brand alignment, new fields, SafetyNotice |
| `app/applications/page.tsx` | Edited — ErrorState, EmptyState, copy improvements |
| `app/dashboard/page.tsx` | Edited — removed "Private beta —" from two onboarding checklists |
| `app/recruiter/auditions/new/page.tsx` | Edited — self-tape copy |
| `app/messages/page.tsx` | Edited — eyebrow copy |
| `CORE_APPLICATION_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
| `CHANGELOG.md` | Updated |
| `TESTING.md` | Updated |
| `PRODUCT_STATUS_AND_ROADMAP.md` | Updated |
| `FULL_APP_UX_POLISH_REPORT.md` | Updated |
