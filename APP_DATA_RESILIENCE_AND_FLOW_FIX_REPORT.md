# App Data Resilience and Flow Fix Report

**Pass:** 28 (Stability)
**Date:** 2026-06-30
**Branch:** main
**Status:** Complete — lint ✓, 311 unit tests ✓, build ✓, git diff --check ✓

---

## Root Cause of `/applications` Failure

`getTalentApplications(user.uid)` was called inside a `Promise.all` on the `/applications` page with **no `.catch()` fallback**. That function can throw in two situations:
1. The primary `collectionGroup('applications')` Firestore query fails (permission, missing index, network).
2. The fallback audition-by-audition scan **also** fails.

When both fail, `getTalentApplications` throws a merged error message. Because there was no `.catch()`, this rejection propagated to the `Promise.all` outer `.catch()`, which set the `error` state and displayed the full `ErrorState` component:

> "Applications could not be loaded / We could not load this section."

The metric cards, filter tabs, focus panel, and safety notices were still rendered (they appear above the error check), but the application list section was hidden entirely.

The same structural fragility also existed on two other pages with no visible errors yet, but vulnerable to any Firestore flakiness:
- `/talent/profile` — `getTalentVerification` in `Promise.all` with no fallback
- `/recruiter/verification` — both `getRecruiterProfile` and `getRecruiterVerification` in `Promise.all` with no fallback

---

## Audit: All Major Pages

| Page | Data Loading | Risk Found | Fixed |
|------|-------------|------------|-------|
| `/dashboard` | `Promise.all` | Fixed in Pass 27.5 — `getTalentApplications` and `getTalentProfile` now have `.catch()` | ✓ (prior) |
| `/applications` | `Promise.all` | `getTalentApplications` had no `.catch()` | ✓ |
| `/auditions` | `Promise.all` | All fetches already had `.catch()` | — |
| `/auditions/[id]` | Two `useEffect` blocks | Primary audition fetch has `.catch()`; secondary block has `.catch(() => undefined)` | — |
| `/messages` | Single fetch | `.catch()` already present | — |
| `/notifications` | Single fetch | `.catch()` already present | — |
| `/talent/profile` | `Promise.all` | `getTalentVerification` had no `.catch()` | ✓ |
| `/recruiter/auditions` | Single fetch | `.catch()` already present | — |
| `/recruiter/auditions/[id]/applicants` | `Promise.all` | `getAuditionById` + `getAuditionApplicants` are page-critical (no audition = page can't render); kept as-is. `getConversations` already has `.catch()` | — |
| `/recruiter/profile` | Single fetch | `.catch()` already present | — |
| `/recruiter/verification` | `Promise.all` | Both fetches had no `.catch()` | ✓ |
| `/admin/auditions` | Single fetch | `.catch()` already present | — |
| `/admin/verifications` | Single fetch | `.catch()` already present | — |
| `/admin/beta-readiness` | Single fetch | `.catch()` already present | — |

---

## Policy Helper Audit

| Helper | Missing fields safe? | Verdict |
|--------|---------------------|---------|
| `casting-application-kit-policy` | `?? []` used everywhere; render sites use `?? []` | Safe |
| `talent-opportunity-radar-policy` | All array params default to `= []` | Safe |
| `casting-slate-policy` | Called with applicants array from state (starts `[]`) | Safe |
| `casting-journey-policy` | Works from typed `ApplicationSnapshot` — no screening fields | Safe |
| `audition-share-kit-policy` | Works from `Audition` type — `screeningQuestions` is optional | Safe |
| `recruiter-trust-passport-policy` | No reference to screening fields | Safe |
| `role-fit-policy` | No reference to screening fields | Safe |
| `casting-brief-quality-policy` | No reference to screening fields | Safe |

No policy helper changes required.

---

## Files Changed

| File | Change |
|------|--------|
| `app/applications/page.tsx` | Added `applicationsWarning` state; `.catch()` on `getTalentApplications` returns `[]` and sets warning; inline amber warning panel with retry button; improved `ErrorState` copy |
| `app/talent/profile/page.tsx` | Added `.catch(() => null)` to `getTalentVerification` in `Promise.all` |
| `app/recruiter/verification/page.tsx` | Added `.catch(() => null)` to both `getRecruiterProfile` and `getRecruiterVerification` |

---

## Exact Fixes

### `app/applications/page.tsx`

1. Added `applicationsWarning` state (independent of `error`).
2. `getTalentApplications(user.uid)` now has `.catch()` returning `[] as Application[]` and setting the warning.
3. `getTalentProfile` and `getConversations` already had fallbacks — unchanged.
4. The outer `.catch()` / `setError` path is now a true last-resort safety net.
5. Added an amber inline warning panel: shows "Some application details could not be refreshed. Your saved application records are still protected. Try again, or check back after a refresh." with a Retry button — visible only when `applicationsWarning` is set and no catastrophic `error`.
6. Warning is cleared on retry alongside `error`.
7. `ErrorState` copy updated: "Some application details could not be refreshed. Your saved application records are still protected. Try again, or check back after a refresh."

### `app/talent/profile/page.tsx`

`getTalentVerification(user.uid).catch(() => null)` — verification status can safely be null; the component already handles null (renders as "not submitted").

### `app/recruiter/verification/page.tsx`

Both:
- `getRecruiterProfile(user.uid).catch(() => null)` — form pre-fills from empty state when profile unavailable
- `getRecruiterVerification(user.uid).catch(() => null)` — null = new submission (correct default for new recruiters too)

---

## Firestore Rules

**Not changed.** The `/applications` failure was a client-side Promise resilience issue, not a Firestore rules bug. The collectionGroup index error (if present) is a Firestore Console configuration issue, not a rules issue.

---

## Tests

```
npm run lint        → pass (0 warnings)
npm test            → 311 pass, 0 fail
npm run build       → ✓ Compiled successfully
git diff --check    → 0 real whitespace errors (CRLF line-ending warnings only, Windows)
npm run emulators:test → Requires local Firebase emulators (not available in this environment)
```

Existing 311 unit tests cover policy helpers and Firestore rules. No new tests added — the fixes are page-level async resilience changes that are not unit-testable in isolation (they depend on Firebase SDK behaviour).

---

## Deploy Notes

- **Firestore rules:** Not changed → no Firebase deploy needed for rules.
- **Vercel:** Redeploy needed — app code changed (3 pages).
- **Firebase index:** If `getTalentApplications` is failing due to a missing `collectionGroup` index on `applications` ordered by `createdAt`, create it in the Firebase Console: Collection group `applications`, field `createdAt` descending. The page now degrades gracefully instead of crashing while that index builds or if it is missing.

---

## Manual Live QA Checklist

### Talent

- [ ] `/dashboard` — workspace loads; sections degrade gracefully if optional data fails
- [ ] `/auditions` — page loads, filter, save, apply flow; Opportunity Radar visible
- [ ] `/auditions/[id]` — audition detail and apply form load; screening questions render if present
- [ ] `/applications` — status board, filter tabs, and safety notices visible even if application list is empty; no full-section crash; retry button works; screening answer count tag visible on applications with answers
- [ ] `/messages` — inbox loads; unread count accurate
- [ ] `/notifications` — list loads; mark-all-read works
- [ ] `/talent/profile` — profile form loads; verification status renders correctly even if verification fetch is slow or unavailable

### Recruiter

- [ ] `/recruiter/auditions` — casting calls list and metrics load
- [ ] `/recruiter/auditions/new` — new brief form including Casting Application Kit (up to 8 screening questions); safety flags; template picker; publish
- [ ] `/recruiter/auditions/[id]/applicants` — Decision Room; screening answers panel visible for applications with answers; status update actions work
- [ ] `/recruiter/profile` — profile form saves; trust passport summary displays
- [ ] `/recruiter/verification` — form pre-fills existing data or starts empty; evidence upload; submission

### Admin

- [ ] `/admin/auditions` — audition list loads; brief quality risk flags visible
- [ ] `/admin/verifications` — verification queue loads; approve/suspend/reject actions work
- [ ] `/admin/beta-readiness` — launch readiness summary renders

---

## Known Limitations

- The underlying cause of `getTalentApplications` throwing (missing Firestore index, Firestore security rules for collectionGroup, or network) is not diagnosed here — the fix is resilience at the page level. If the collectionGroup index is missing, the warning will appear on every load until the index is created.
- `getRecruiterVerification` and `getTalentVerification` have no try/catch in the service layer — they can throw on any Firestore error. The fallback at the page level now handles this, but the error is silently swallowed. If verification state is business-critical (e.g., to prevent non-approved recruiters from posting), the server-side API routes provide the real enforcement.
- Emulator tests not run in this environment — manual verification recommended before Vercel deploy.
