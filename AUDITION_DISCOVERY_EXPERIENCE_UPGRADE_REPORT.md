# Audition Discovery and Application Conversion Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make audition discovery feel like a serious casting marketplace. Give Talent the context they need to find the right roles, convert more save-to-apply, and submit with confidence.

---

## Pages Reviewed

| Page | File | Assessment before this pass |
|------|------|----------------------------|
| Audition discovery | `app/auditions/page.tsx` | Strong filter system; `font-semibold` on view description; empty state messages vague; MetricCard detail text generic; no safety reminder |
| Casting brief detail | `app/auditions/[id]/page.tsx` | Brand-aligned from Pass 3; apply aside had no sub-text or post-apply guidance; no "not accepting" notice; button text did not adapt for logged-out users |
| Dashboard (Talent) | `app/dashboard/page.tsx` | Strong next-action logic; `nextStepMessages` used casual language inconsistent with `app/applications/page.tsx` |
| Audition card | `components/audition-card.tsx` | Already very strong — Chip system, trust badges, cinematic hover, applied gold accent. No changes needed |
| Discovery logic | `app/lib/audition-discovery.ts` | Clean filter, sort, and scoring logic. No changes needed |
| Application policy | `app/lib/application-policy.ts` | Clean policy with correct deadline and duplicate-application guards. No changes needed |

---

## Audition Discovery Page Improvements (`app/auditions/page.tsx`)

### Import: SafetyNotice added
`SafetyNotice` added to the `@/components/product-ui` import so a safety reminder can appear at the bottom of the discovery page.

### View description: `font-semibold` → `font-bold` + improved copy
**Before (both views):**
```
font-semibold text-[#657176]
'Showing roles you bookmarked for later.'
'Browse all active casting calls.'
```
**After:**
```
font-bold text-[#657176]
'Roles you bookmarked — review and apply before the deadline closes.'
'All active casting calls. Use filters to narrow by category, location, or deadline.'
```
The updated copy is directive and deadline-aware for saved view; instructional for the all-auditions view.

### MetricCard detail: more specific casting language
| Label | Before | After |
|-------|--------|-------|
| Visible matches | "Current search result" | "Matching this search" |

The other three MetricCard detail strings ("Trust-checked casting teams", "Bookmarked for follow-up", "Active application records") were already strong.

### Empty state messages: actionable next step
| State | Before | After |
|-------|--------|-------|
| Saved view empty | "Save roles you like and return before the deadline." | "Browse all auditions and bookmark the roles that fit your profile. Return here to apply before the deadline." |
| No-results empty | "Try removing a filter or broadening your search." | "Try removing a filter or clearing all to see every active casting call." |

The new saved-view message tells users *where to go and why*, not just what they haven't done yet. The no-results message makes "clearing all" a concrete, discoverable action.

### SafetyNotice added at page bottom
A `SafetyNotice` appears at the bottom of the discovery page after the audition grid (and after the empty state), visible whenever the page has loaded without error:

> **Never pay to audition**  
> Legitimate casting calls on Nata Connect are free to apply to. If a recruiter asks you to pay, deposit, or share financial details as part of audition consideration, report them immediately.

This is the earliest point in the Talent funnel where the platform can set safety expectations before a user clicks through to a brief and applies.

---

## Casting Brief Detail Improvements (`app/auditions/[id]/page.tsx`)

### Apply aside: sub-text for conversion
**Before:** h2 "Apply for this role" with no explanatory text — Talent goes directly to the textarea.

**After:** Added a sub-line under the h2:
> "Your profile and media are included automatically. Use this message to stand out to the casting team."

This removes ambiguity about what gets sent and reduces friction for first-time applicants.

### Apply aside: closed-audition notice
**Before:** Button disabled silently when `audition.status !== 'ACTIVE'` — no explanation.

**After:** Amber notice appears above the cover message textarea when the audition is not accepting applications:
> "This audition is no longer accepting applications."

Users now understand immediately why the submit button is disabled.

### Apply aside: button text adapts for unauthenticated users
**Before:** Button always read "Submitting..." or "Submit application" regardless of login state. Unauthenticated users would click it and be redirected to login with no prior indication that login was required.

**After:**
```
{!user ? 'Log in to apply' : applying ? 'Submitting...' : 'Submit application'}
```
Unauthenticated users see "Log in to apply" — a clear, honest CTA that sets expectations before the redirect.

### Apply aside: post-apply guidance
**After:** Small centred text below the submit button:
> "After applying, track your status in My Applications."

This closes the loop — Talent knows where to go after applying, reducing support questions and re-application attempts.

---

## Dashboard Improvements (`app/dashboard/page.tsx`)

### `nextStepMessages` aligned with casting language
The `nextStepMessages` object in the dashboard was using casual, generic language. These messages appear in the "Recent applications" widget on the Talent dashboard alongside the StatusBadge. Updated to match the casting-specific language established in `app/applications/page.tsx` while keeping them brief for the compact widget context.

| Status | Before | After |
|--------|--------|-------|
| APPLIED | "Your application was sent" | "Waiting for the casting team to open your application." |
| VIEWED | "Recruiter opened your application" | "The casting team opened your application." |
| UNDER_REVIEW | "Recruiter is reviewing your profile" | "Your profile is under active review." |
| MAYBE | "You are still in consideration" | "You are in the casting pool." |
| SHORTLISTED | "You are being considered for next steps" | "You made the shortlist." |
| CALLBACK | "Recruiter may contact you for another round" | "You have a callback — watch for a message." |
| FINAL_ROUND | "You moved to final review" | "You are in the final casting round." |
| SELECTED | "You were selected" | "You were selected. Expect a message with next steps." |
| REJECTED | "This role moved forward with someone else" | "The casting team moved forward with another applicant." |
| WITHDRAWN | "You withdrew this application" | (unchanged) |

---

## What Was Not Changed

### `components/audition-card.tsx`
Already very strong from the design system pass. The Chip component, cinematic left-border hover accent, applied gold accent, trust/new/urgent/category chip variants, and "View casting brief" CTA are all well-implemented. No changes needed.

### `app/lib/audition-discovery.ts`
Filter, sort, and scoring logic is clean and correct. All 5 sort modes (RELEVANCE, RECOMMENDED, NEWEST, DEADLINE, UPDATED) and the `scoreAuditionRecommendation()` function work as designed. No changes needed.

### `app/lib/application-policy.ts`
Policy correctly blocks duplicates, non-ACTIVE auditions, expired deadlines, and deleted auditions. No changes needed.

---

## What Remains for Future Versions

- **Saved-audition expiry notice** — if a saved audition closes before the user returns, there is no notification or badge on the saved view showing "deadline passed"
- **Recommended-for-you explanation** — the RECOMMENDED sort uses profile-based scoring but gives no visible explanation of why an audition ranked highly
- **Filter presets / saved searches** — no ability to save a filter combination for repeat use
- **Audition alert subscriptions** — no way to subscribe to new auditions matching a profile category or location
- **Share a casting brief** — no shareable link or social card for a specific audition page

---

## Manual Test Checklist

### Audition discovery page (`/auditions`)

- [ ] View description for "All auditions" tab reads: "All active casting calls. Use filters to narrow by category, location, or deadline."
- [ ] View description for "Saved" tab reads: "Roles you bookmarked — review and apply before the deadline closes."
- [ ] View description uses `font-bold` (not `font-semibold`)
- [ ] MetricCard for visible/saved count shows detail "Matching this search"
- [ ] Empty state (saved view, no saves): message contains "Browse all auditions and bookmark the roles that fit your profile."
- [ ] Empty state (all view, no results): message reads "Try removing a filter or clearing all to see every active casting call."
- [ ] SafetyNotice visible at page bottom after load (whether results or empty state)
- [ ] SafetyNotice title reads "Never pay to audition"
- [ ] SafetyNotice not shown during loading or error state

### Casting brief detail page (`/auditions/[id]`)

- [ ] Apply aside shows sub-text: "Your profile and media are included automatically. Use this message to stand out to the casting team."
- [ ] When `audition.status !== 'ACTIVE'`: amber notice "This audition is no longer accepting applications." appears above textarea
- [ ] When not logged in: button reads "Log in to apply"
- [ ] When logged in and audition is ACTIVE: button reads "Submit application"
- [ ] When submitting: button reads "Submitting..."
- [ ] Post-apply guidance text: "After applying, track your status in My Applications." visible below button
- [ ] Cover message textarea label unchanged ("Cover message")
- [ ] Cover message textarea placeholder unchanged ("Introduce yourself and explain why you fit this role.")
- [ ] All existing article content unchanged: Detail grid, About the role, Requirements, Self-tape section, SafetyNotice at bottom of article

### Dashboard — Recent applications widget (`/dashboard`)

- [ ] APPLIED: "Waiting for the casting team to open your application."
- [ ] VIEWED: "The casting team opened your application."
- [ ] UNDER_REVIEW: "Your profile is under active review."
- [ ] MAYBE: "You are in the casting pool."
- [ ] SHORTLISTED: "You made the shortlist."
- [ ] CALLBACK: "You have a callback — watch for a message."
- [ ] FINAL_ROUND: "You are in the final casting round."
- [ ] SELECTED: "You were selected. Expect a message with next steps."
- [ ] REJECTED: "The casting team moved forward with another applicant."
- [ ] WITHDRAWN: "You withdrew this application." (unchanged)

---

## Firebase Deploy Notes

No Firestore rules, indexes, or Cloud Functions were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required for the following changed pages:

- `app/auditions/page.tsx`
- `app/auditions/[id]/page.tsx`
- `app/dashboard/page.tsx`

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/auditions/page.tsx` | Edited — SafetyNotice import and usage; font-bold fix; view description copy; MetricCard detail; empty state messages |
| `app/auditions/[id]/page.tsx` | Edited — apply aside sub-text; closed-audition notice; button text for unauthenticated users; post-apply guidance text |
| `app/dashboard/page.tsx` | Edited — nextStepMessages updated to casting-specific language |
| `AUDITION_DISCOVERY_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
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
