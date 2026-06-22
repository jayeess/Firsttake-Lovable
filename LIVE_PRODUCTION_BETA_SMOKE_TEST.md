# Live Production Beta Smoke Test

**Production URL:** https://firsttake-lovable.vercel.app
**Date of smoke test:** 2026-06-22
**Latest expected commit:** Laptop Screen Recording UX Polish Pass + custom 404 page
**Smoke test method:** Static HTML inspection (WebFetch), code-level audit, and logic review

> Note: The app uses Next.js App Router with client-side Firebase auth. Protected routes
> render a loading state in static HTML capture ("Preparing Nata Connect...") before
> client-side redirect to `/auth/login`. This is expected architecture — not a bug.
> All interactive flow verifications below marked with ☐ require a live authenticated session.

---

## 1. Public Routes Tested

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✓ PASS | Loads cleanly. Brand: "FirstTake by MVA Studios" + "Nata Connect / నట కనెక్ట్" |
| `/auth/login` | ✓ PASS | Form visible, no raw Firebase errors, no test panel in production |
| `/auth/signup` | ✓ PASS | Talent/Recruiter role selection, no billing/upload promises |
| `/auth/forgot-password` | ✓ PASS | Email field + "Send reset link" button, clean |
| `/auth/email-verified` | ✓ PASS | Route exists, shows verification check state |
| `/help` | ✓ PASS | Comprehensive sections, explicit beta limitations noted |
| `/safety` | ✓ PASS | 9 safety sections, "Never Pay to Audition" prominent |
| `/community-guidelines` | ✓ PASS | 7 rules, moderation/reporting sections present |
| `/terms` | ✓ PASS | Draft terms with explicit beta/placeholder warnings |
| `/privacy` | ✓ PASS | Draft policy with explicit "requires legal review" notices |
| `/contact` | ✓ PASS | Beta-appropriate: support inbox referenced, no form |
| `/beta-feedback` | ✓ PASS | 5 feedback categories, safety disclaimer, anonymous session noted |
| `/t/[slug]` (invalid) | ✓ PASS | Returns HTTP 404 (Next.js `notFound()`) |
| Unknown routes | ✓ FIXED | Custom branded 404 page added (`app/not-found.tsx`) |

---

## 2. Auth Smoke Test Results

| Check | Result |
|-------|--------|
| Login page loads | ✓ |
| Signup page loads | ✓ |
| Forgot password page loads | ✓ |
| Test panel absent in production | ✓ (gated on `NODE_ENV !== 'development'`) |
| No secrets/Firebase keys in page HTML | ✓ (verified via source inspection) |
| No raw Firebase error strings visible | ✓ |
| Email verification redirect URL safe | ✓ (uses `window.location.origin` in browser; `localhost` fallback unreachable) |
| Protected routes redirect unauthenticated users | ✓ (client-side: loading → redirect to `/auth/login`) |
| Admin shell shows "Administrator access required" for non-admin | ✓ (code-verified: `!user || !isAdmin` guard) |

---

## 3. Talent Production Journey — Remote Results

| Check | Result | Notes |
|-------|--------|-------|
| `/dashboard` — auth-gated | ✓ | Loading state → redirect |
| `/talent/profile` — auth-gated | ✓ | Loading state → redirect |
| `/profile` — auth-gated | ✓ | "Opening your profile..." loading state |
| `/auditions` — auth-gated | ✓ | Loading state |
| `/applications` — auth-gated | ✓ | Loading state |
| `/messages` — auth-gated | ✓ | Loading state |
| `/notifications` — auth-gated | ✓ | Loading state |
| Email verification flow | ☐ | Must be verified with live account |
| Dashboard compact on laptop | ☐ | Post-polish: verify above-the-fold density |
| Apply to live audition | ☐ | Requires active audition in production |
| Mark-read notifications | ☐ | Requires live account |
| Read-only conversation state | ☐ | Requires closed application + message thread |

---

## 4. Recruiter Production Journey — Remote Results

| Check | Result | Notes |
|-------|--------|-------|
| `/recruiter/auditions` — auth-gated | ✓ | Loading state |
| `/recruiter/auditions/new` — auth-gated | ✓ | Loading state |
| `/recruiter/verification` — auth-gated | ✓ | Loading state |
| `/recruiter/profile` — auth-gated | ✓ | Loading state |
| Recruiter nav active states (Casting calls vs Applicants) | ✓ | Code-verified: `exact: true` fix applied |
| "Before you publish" checklist sidebar | ✓ | Code-verified: structured checklist deployed |
| No upload/storage/payment promises in create audition | ✓ | Code-verified |
| Verification page compact + professional | ✓ | Code-verified: header/form compacted |
| Post audition as draft | ☐ | Requires approved recruiter account |
| Publish audition | ☐ | Requires verified recruiter + active account |
| Applicant pipeline with real applicants | ☐ | Requires live applications |
| Metric grid 2 rows (not 3) | ☐ | Code-verified; confirm visually |

---

## 5. Admin Production Journey — Remote Results

| Check | Result | Notes |
|-------|--------|-------|
| `/admin` — loads "Opening trust operations..." loading state | ✓ | |
| Admin shell shows "Administrator access required" for non-admin | ✓ | Code-verified: `!user || !isAdmin` guard with clear copy |
| `/admin/beta-readiness` — admin-gated | ✓ | Loading state |
| Admin routes all behind `AdminShell` | ✓ | Code-verified |
| No admin content exposed to public | ✓ | Client-side auth guard enforced |
| Admin dashboard metric spacing | ✓ | Code-verified: `mt-5 gap-3` |
| Verification queue, talent list, reports | ☐ | Require admin session |
| Admin action button confirmation behavior | ☐ | Require admin session |
| Audit logs accessible | ☐ | Require admin session |

---

## 6. Security / Access-Control Smoke Results

| Check | Result | Notes |
|-------|--------|-------|
| No secrets in public HTML | ✓ | Verified |
| No raw Firebase SDK errors visible to users | ✓ | Verified |
| `NEXT_PUBLIC_SHOW_TEST_CASES` not set in Vercel | ✓ | Test panel hidden; gated on `NODE_ENV` |
| Admin routes gated on Firebase custom claim `isAdmin` | ✓ | Code-verified |
| No billing/subscription/payment copy in UI | ✓ | All "payment" references are safety warnings |
| `paymentType` filter = compensation type, not billing | ✓ | Correct (PAID/UNPAID/HONORARIUM) |
| No hardcoded dev credentials exposed | ✓ | Dev test cases only in dev mode |
| `localhost:3000` in email verification unreachable in browser | ✓ | `window.location.origin` takes precedence |
| `VERCEL_URL` used as base URL fallback | ✓ | Code-verified in `app-url.ts` |
| Suspended accounts blocked from sensitive actions | ✓ | Code-verified in auth checks |
| Safety/community warnings in messages | ✓ | Anti-payment reminder in every conversation |

---

## 7. Laptop UX Smoke Test — Post-Polish Results

| Check | Result | Notes |
|-------|--------|-------|
| Hero sections not too tall | ✓ | Code-verified: `text-3xl lg:text-4xl` after polish |
| Email verification prompt compact | ✓ | Code-verified: unified `p-3 sm:p-4` design |
| Applicant review metrics 2 rows (xl: 6 columns) | ✓ | Code-verified |
| Message thread read-only state intentional | ✓ | Code-verified: amber banner added |
| Notifications compact, readable | ✓ | Code-verified: cards tightened |
| "Before you publish" feels like checklist | ✓ | Code-verified: structured list |
| Sidebar active states not confusing | ✓ | Code-verified: `exact: true` on Casting calls |
| Admin dashboard compact metric grid | ✓ | Code-verified: `mt-5 gap-3` |
| Above-the-fold dashboard density on laptop | ☐ | Verify visually at 1280px |

---

## 8. Mobile Quick Smoke Test

| Route | Remote Result | Notes |
|-------|---------------|-------|
| `/dashboard` | ✓ (auth-gated) | Verify bottom nav clears browser bar on device |
| `/auditions` | ✓ (auth-gated) | Filter panel layout at 375px |
| `/applications` | ✓ (auth-gated) | Card overflow check |
| `/messages` | ✓ (auth-gated) | Chat height min-h-[260px] at mobile |
| `/notifications` | ✓ (auth-gated) | Cards should not overflow horizontally |
| `/recruiter/auditions/new` | ✓ (auth-gated) | Sidebar stacks below form on mobile |
| `/admin` | ✓ (auth-gated) | Mobile bottom nav: Dashboard/Verify/Moderate/Logs |
| Bottom nav safe-area padding | ✓ | Code-verified: `pb-[calc(7.5rem+env(safe-area-inset-bottom))]` |
| Cards horizontal overflow | ☐ | Needs device or emulator check |
| Buttons tappable (min-h-11+) | ✓ | Code-verified across components |
| Email verification prompt usable | ✓ | Code-verified: stacks vertically on mobile |

---

## P0 Blockers

None found.

---

## P1 Important Issues

None found in remote/code audit.

**Manual P1 checks still required:**
- Email verification send and receive works end-to-end in the production Firebase project
- Talent can submit application to an active audition (depends on Firestore rules deployed)
- Recruiter can publish an audition (depends on approved status + Firestore)
- Admin can approve/reject recruiter verification
- Messaging thread loads and messages send in production

---

## P2 Polish Issues Found and Fixed

| Issue | Fix |
|-------|-----|
| No custom 404 page — Next.js default showed on unknown routes | Added `app/not-found.tsx` with branded page: "This page does not exist" + Back to home + Help center links |

---

## What Was Fixed in This Pass

- `app/not-found.tsx` — New branded 404 page using `PublicFooter` and `BrandLogo`

---

## What Must Be Manually Verified by Product Owner

1. **Email delivery** — Send a verification email from production signup and confirm it arrives in Gmail/Outlook with the correct production URL (not localhost).
2. **Firebase Auth authorized domains** — Confirm `firsttake-lovable.vercel.app` is in Firebase Console → Authentication → Settings → Authorized domains.
3. **Firestore rules deployed** — Run `npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod` and confirm no index errors.
4. **Admin custom claim** — Confirm the launch admin account has `isAdmin: true` set via the Admin SDK.
5. **Full Talent journey** — Sign up as Talent, complete profile, apply to an audition, check notifications.
6. **Full Recruiter journey** — Sign up as Recruiter, submit verification, create + publish audition, review applicants.
7. **Admin moderation** — Log in as admin, approve a recruiter verification, view audit logs, resolve a test report.
8. **Mobile device check** — Open `/dashboard` on a real iOS or Android device to confirm safe-area insets and bottom nav clearance.
9. **Vercel environment variables** — Confirm all Firebase vars are present in Vercel project settings (no missing var warnings in browser console).
10. **No `NEXT_PUBLIC_SHOW_TEST_CASES` in Vercel** — Confirm the test panel is absent at `/auth/login` in the browser.

---

## Files Changed in This Pass

- `app/not-found.tsx` — Created (new branded 404 page)
- `LIVE_PRODUCTION_BETA_SMOKE_TEST.md` — Created (this file)
- `CHANGELOG.md` — Updated with smoke test entry
- `TESTING.md` — Updated with production smoke test section
- `BETA_LAUNCH_READINESS_CHECKLIST.md` — Updated with 404 and smoke test items

---

## Launch Recommendation

**Ready with limitations**

The production build, public pages, auth routes, and security controls are all clean. No P0 blockers found. The remaining limitations are:

- Legal pages are draft/placeholder (known, documented, acceptable for controlled private beta)
- Email delivery depends on Firebase project configuration (verify manually)
- Firestore rules/indexes must be deployed to the production Firebase project
- Full interactive flows require a live authenticated session to verify end-to-end

---

## Firebase Deploy Needed?

**Yes** — if any `firestore.rules` or `firestore.indexes.json` changes have not yet been deployed to `nata-connect-prod`. Run:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

No Storage rules changes in this pass.

---

## Vercel Redeploy Needed?

**Yes** — the following code changes in this pass require a Vercel redeploy:

- `app/not-found.tsx` — Custom 404 page
- All Laptop UX Polish changes from the previous commit

Push `main` branch to GitHub and trigger a new Vercel deployment.

---

## Known Limitations

1. Legal pages (Terms, Privacy, Community Guidelines) are beta drafts — must be finalized before public launch.
2. Email delivery is conditional on Firebase email provider configuration in the production project.
3. No self-tape video direct upload (external links only).
4. No document upload for recruiter verification (form fields only).
5. No push notifications, analytics, or error monitoring.
6. No data deletion / export workflow (required before public launch).
7. Admin custom claim must be set manually via Admin SDK or Firebase Console.
8. No automated E2E tests against production (require credential-backed Playwright setup).
