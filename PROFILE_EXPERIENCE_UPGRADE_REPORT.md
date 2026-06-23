# Profile Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make Talent profiles, public portfolios, and Recruiter company profiles feel like serious casting-industry assets — not basic account pages.

---

## Pages Reviewed

| Page | File | Assessment before this pass |
|------|------|----------------------------|
| Talent profile editor | `app/talent/profile/page.tsx` | Good structure; had `font-semibold` inconsistency + "private-beta" copy |
| Public Talent portfolio | `app/t/[slug]/page.tsx` | Functional but no `rounded-md`, skills/languages mixed, no contact guidance |
| Recruiter profile editor | `app/recruiter/profile/page.tsx` | Good; `font-semibold` in forms + amber box in wrong location |
| Recruiter verification | `app/recruiter/verification/page.tsx` | "Private-beta verification" title + beta language in 2+ places |
| Applicant review | `app/recruiter/auditions/[id]/applicants/page.tsx` | Strong; missing experience chip, no portfolio link, mixed skills/langs, `font-semibold` in detail values |
| Profile bridge | `app/profile/page.tsx` | Simple redirect bridge — no changes needed |

---

## Talent Profile Improvements (`app/talent/profile/page.tsx`)

### Typography consistency
- `Field` helper component: `font-semibold` → `font-bold` — brings form labels in line with the brand system used everywhere else
- Inline checkbox label (`isPublic`): `font-semibold` → `font-bold`; label text changed from "Public profile enabled" → **"Enable public portfolio page"** (casting-specific language)

### Copy: removed beta qualifier
- Verification pending notice: "Your profile is in the **private-beta** review queue" → "Your profile is in the **verification** review queue" — the review queue is a permanent product feature, not a beta-only concept

---

## Public Talent Portfolio Improvements (`app/t/[slug]/page.tsx`)

### Visual polish
- Main profile card: added `rounded-md` (was a sharp-cornered card, inconsistent with the rest of the product)
- Profile photo container: added `rounded-md`
- "Selected work" section: added `rounded-md border border-[#cbd9df]` (was a floating `bg-white` block with no border)
- "Professional links" section: added `rounded-md`
- Showreel link items: added `rounded-md`

### Skills and Languages separation
**Before:** Skills and languages were merged into a single unlabeled chip group, making it impossible for a recruiter scanning the profile to know which chips are skills vs languages.

**After:** Two distinct labeled groups:
- **Skills** — neutral `#f4f8fa` background chips
- **Languages** — teal-tinted `#edf7f5` / `text-[#006b60]` chips, visually distinct from skills

This mirrors the styling used on the applicant review page (post-pass) for visual consistency.

### Casting inquiry note
Added a subtle footer line after all profile content:
> Casting inquiries go through **Nata Connect**. Sign up as a Recruiter to post auditions and message Talent directly.

Provides a conversion path for non-authenticated visitors (casting recruiters browsing public profiles) without being intrusive.

---

## Recruiter Profile Improvements (`app/recruiter/profile/page.tsx`)

### Typography consistency
- `className="block text-sm font-semibold"` → `className="block text-sm font-bold"` (applied to both company detail field labels and company bio label via `replace_all`)

### Verification note placement
**Before:** An amber `border-amber-300 bg-amber-50` box inside the "Casting identity" profile section said: "Verification documents and admin approval are the next onboarding phase. Your profile currently remains pending verification unless already approved." — misleading placement (inside the bio form section, not about bio), and the `ReadinessChecklist` already covers verification status.

**After:** Replaced with a `PrivacyNote` ("Platform safety expectation") that is relevant to the bio section and the platform's casting values:
> Casting briefs on Nata Connect must not charge Talent. Never request fees, deposits, or payments as part of any audition or casting process.

This reinforces trust and is directly applicable to what recruiters are writing in their bio and casting identity.

---

## Recruiter Verification Improvements (`app/recruiter/verification/page.tsx`)

Three beta-language removals:

| Location | Before | After |
|----------|--------|-------|
| Page title | "Private-beta verification" | "Company verification" |
| Success message | "Verification submitted for private-beta admin review." | "Verification submitted. The trust team will review your details and get back to you." |
| Documents section | "For beta verification, the trust team reviews your company details..." | "The verification team reviews your company details, website, social proof links, and production description from this form." |

Recruiter verification is a permanent product feature — it should not be framed as temporary beta infrastructure.

---

## Applicant Review Profile Signal Improvements (`app/recruiter/auditions/[id]/applicants/page.tsx`)

### Experience level chip in compact card view
**Before:** TalentChip row showed: Category · Location · Completeness% · (up to 2 languages) · (up to 2 skills) · Media count.

**After:** Added **Experience level** chip between Category and Location. Recruiters scan for experience fit before deciding whether to expand the full profile.

### Public portfolio link in compact card view
When a Talent member has a public profile (`talent.publicSlug`), a **Portfolio** button now appears alongside "Open self-tape" and "Review profile" in the card action row. This lets recruiters open the full public casting portfolio in a new tab without expanding the internal review panel.

### Skills and Languages separation in expanded review
**Before:** In the expanded "Talent profile" section, skills and languages were merged into one unstyled chip group — identical to the pre-pass public profile behavior.

**After:** Two labeled rows:
- **Skills** — neutral white chips
- **Languages** — teal-tinted chips (`#edf7f5` / `text-[#006b60]`)

### "View public portfolio →" link in expanded Talent profile section
When a Talent member has a `publicSlug`, a **"View public portfolio →"** text link appears below the skills/languages group in the expanded review panel. Recruiters can jump to the shareable casting profile.

### ApplicantDetail font fix
`ApplicantDetail` component: `font-semibold capitalize` → `font-bold capitalize` for the value display.

---

## What Remains for Future Versions

- **Profile photo upload** — currently supported only via Firebase Storage media manager (`TalentMediaManager`); no direct profile photo upload from this form
- **Company logo upload** — `companyLogo` field exists in `RecruiterProfile` type but has no UI; requires Firebase Storage
- **Showreel/portfolio video embed** — external links only; no in-page video player
- **Public Recruiter profiles** — no `/r/[slug]` equivalent for recruiters; casting directors have no shareable public page
- **Social link verification** — Instagram, YouTube, and portfolio URLs are not verified for authenticity
- **Profile export / PDF** — no casting sheet or PDF export of Talent profile

---

## Manual Test Checklist

### Talent profile (`/talent/profile`)
- [ ] All form field labels show `font-bold` (not `font-semibold`)
- [ ] "Enable public portfolio page" checkbox label visible (was "Public profile enabled")
- [ ] Verification pending notice reads "verification review queue" (not "private-beta review queue")
- [ ] Profile completeness bar fills correctly as fields are populated
- [ ] Verification submit button appears at 70%+ completeness with not_submitted or rejected status

### Public Talent portfolio (`/t/[slug]`)
- [ ] Profile card has rounded corners
- [ ] Profile photo has rounded corners
- [ ] Skills chips render in neutral grey style with "Skills" label above
- [ ] Languages chips render in teal style with "Languages" label above
- [ ] "Selected work" section has border and rounded corners (not bare white)
- [ ] Showreel link items have rounded corners
- [ ] "Professional links" section has rounded corners
- [ ] Footer text reads "Casting inquiries go through Nata Connect." with link to /auth/login
- [ ] Page still 404s for unknown or private (enabled: false) slugs

### Recruiter profile (`/recruiter/profile`)
- [ ] All form field labels show `font-bold`
- [ ] Bio section shows teal `PrivacyNote` "Platform safety expectation" instead of amber box
- [ ] ReadinessChecklist shows 5 items with correct completion states
- [ ] Save redirects to /recruiter/verification

### Recruiter verification (`/recruiter/verification`)
- [ ] Page title reads "Company verification" (not "Private-beta verification")
- [ ] Success message reads "Verification submitted. The trust team will review your details and get back to you."
- [ ] Documents section reads "The verification team reviews your company details..."

### Applicant review (`/recruiter/auditions/[id]/applicants`)
- [ ] TalentChip row shows: Category · Experience · Location · Completeness% · Languages · Skills · Media
- [ ] "Portfolio" button appears for Talent with a publicSlug, opens /t/[slug] in a new tab
- [ ] Expanded "Talent profile" section shows Skills and Languages as separate labeled rows
- [ ] "View public portfolio →" link appears in expanded section when Talent has publicSlug
- [ ] ApplicantDetail values use `font-bold` (not `font-semibold`)

---

## Firebase Deploy Notes

No Firestore rules or indexes were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required to publish the following changed pages:
- `app/talent/profile/page.tsx`
- `app/recruiter/profile/page.tsx`
- `app/recruiter/verification/page.tsx`
- `app/t/[slug]/page.tsx`
- `app/recruiter/auditions/[id]/applicants/page.tsx`

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/talent/profile/page.tsx` | Edited — Field font, checkbox label, beta copy |
| `app/recruiter/profile/page.tsx` | Edited — form fonts, amber box → PrivacyNote |
| `app/recruiter/verification/page.tsx` | Edited — beta language removed (3 locations) |
| `app/t/[slug]/page.tsx` | Edited — rounded-md, skills/langs separation, contact note |
| `app/recruiter/auditions/[id]/applicants/page.tsx` | Edited — experience chip, portfolio link, skills/langs, font fix |
| `PROFILE_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
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
git diff --check → ✓ No whitespace errors
```
