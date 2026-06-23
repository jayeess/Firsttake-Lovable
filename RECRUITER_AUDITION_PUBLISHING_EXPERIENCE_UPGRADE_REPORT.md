# Recruiter Audition Creation and Publishing Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make the recruiter audition creation workflow feel like a guided casting brief builder. Give recruiters context at every field, remove ambiguity around compensation and deadlines, reinforce safety throughout the form, and connect verification to publishing trust.

---

## Pages Reviewed

| Page | File | Assessment before this pass |
|------|------|-----------------------------|
| New casting brief form | `app/recruiter/auditions/new/page.tsx` | Functional 4-section form; no helper text under any field labels; error block used red styling inconsistent with app convention; safety checklist used `font-semibold` instead of `font-bold`; header copy was abstract ("Shape the opportunity clearly.") |
| Recruiter auditions list | `app/recruiter/auditions/page.tsx` | Strong layout with MetricCards and SafetyNotice; CTA label "Post audition" was generic; empty state message referred to verification without explaining what verification unlocks |
| Recruiter verification | `app/recruiter/verification/page.tsx` | Good form layout; description did not explain that verification enables publishing auditions or builds Talent trust |
| Casting brief detail | `app/auditions/[id]/page.tsx` | Already well-structured from Pass 8; no changes needed this pass |

---

## New Casting Brief Form Improvements (`app/recruiter/auditions/new/page.tsx`)

### Page header: abstract → casting-specific

**Before:**
```
eyebrow: "Create casting call"
h1: "Shape the opportunity clearly."
body: "Strong briefs attract stronger applicants. Give talent enough context to know whether the role truly fits."
recruiter access: "Ready to publish"
```

**After:**
```
eyebrow: "New casting brief"
h1: "Build a casting call that attracts the right Talent."
body: "Clear requirements, honest compensation, and a safe process attract stronger applicants. Give Talent enough context to know whether the role truly fits."
recruiter access: "Approved to publish"
```

"Shape the opportunity clearly." was thematic but gave recruiters no guidance on what makes a brief strong. The new h1 makes the outcome concrete. The body copy names the three things that matter: requirements, compensation, and safety. "Approved to publish" is more informative than "Ready to publish" — it signals the recruiter's verified status, not just a UI state.

### Error block: red → amber

**Before:** `border-red-300 bg-red-50 text-sm leading-6 text-red-800`  
**After:** `rounded-md border border-amber-300 bg-amber-50 text-sm leading-6 text-amber-900`

Consistent with the amber error convention used throughout the rest of the app.

### Input component: adds optional `helper` prop

The `Input` component previously rendered only `label + input`. A new optional `helper` prop renders a `<p>` beneath the input in `text-xs font-normal leading-5 text-[#657176]`, consistent with the helper text convention used elsewhere in the product.

### Section 01 — Role basics: field helper text

| Field | Helper added |
|-------|-------------|
| Audition title | "Include the role type and project — be specific enough that Talent can tell at a glance if it fits their profile." |
| Location | "Talent use location to decide whether they can attend in person." |
| Languages | "Comma-separated. Leave blank if the role is open to any language." |

Category, experience level, project type, work mode, and project duration already communicate clearly through their labels and dropdown options — no helpers added.

### Section 02 — Creative brief: helper text under textareas

**Role description** (after textarea):  
"Talent uses this to decide if the role fits their skills — include the project context, character brief, and tone."

**Requirements** (after textarea):  
"Be specific but fair — only list requirements that genuinely affect eligibility."

These helpers were placed inside the `<label>` element after the `<textarea>`, matching the Input component's helper position.

### Section 03 — Self-tape requirements: safety note + label improvement

**Max duration field label:**  
"Max duration in seconds" → "Clip duration limit (seconds)"  
Helper added: "Optional. For example, 90 means each submission must be 90 seconds or under."

**Instructions textarea safety note** (added after textarea):  
"Do not ask Talent to contact you directly outside Nata Connect or to make any payment to participate."

This reinforces the platform safety policy at the exact point where a recruiter might accidentally ask for off-platform contact.

### Section 04 — Publishing: helper text on key fields

| Field | Helper added |
|-------|-------------|
| Application deadline | "Give Talent at least 7 days to prepare and apply." |
| Pay information | "Specific compensation helps Talent make an informed decision — mention rates, fees, or honorarium amounts." |
| Compensation type | "Paid = formal rate; Honorarium = token payment; Unpaid = credit or experience only." (added after select) |

The compensation type helper explains what each option means — many recruiters are uncertain about the Honorarium distinction.

### "Before you publish" checklist: `font-semibold` → `font-bold`

**Before:** `<span className="font-semibold">Never ask Talent to pay to audition</span>`  
**After:** `<span className="font-bold">Never ask Talent to pay to audition</span>`

Consistent with the design system convention of `font-bold` throughout.

---

## Recruiter Auditions List Improvements (`app/recruiter/auditions/page.tsx`)

### WorkspaceHero CTA: generic → casting-specific

**Before:** `actionLabel="Post audition"`  
**After:** `actionLabel="Post a casting brief"`

"Post a casting brief" is more specific — it signals to the recruiter that they are building a structured brief, not just a job listing.

### Empty state: verification-aware → action-oriented

**Before:**
```
title: "No auditions posted yet"
message: "Create a clear casting brief when your recruiter verification is approved."
actionLabel: "Post an audition"
```

**After:**
```
title: "No casting briefs yet"
message: "Post your first casting brief to start reaching Talent on Nata Connect. Verified recruiters see stronger applicant response."
actionLabel: "Post a casting brief"
```

The old message made the empty state contingent on verification, which could confuse already-approved recruiters. The new copy is action-forward and introduces the idea that verification improves applicant quality.

---

## Recruiter Verification Improvements (`app/recruiter/verification/page.tsx`)

### Description: connects verification to publishing trust

**Before:**
```
Tell the review team who you are, what you produce, and where your professional work can be verified.
```

**After:**
```
Tell the review team who you are, what you produce, and where your professional work can be verified. Verified recruiters can publish casting briefs and build Talent trust with a verified badge on every listing.
```

The original description explained what to submit but not why verification matters. The addition answers "what do I get?" — publishing access and a verified badge. This motivates recruiters to complete verification rather than skip it.

---

## What Remains for Future Versions

- **Character count on description/requirements** — long-form textareas have no visual limit indicator; a `maxLength` or character count would help recruiters calibrate
- **Deadline preset buttons** — `dateFromToday()` presets exist in DevFormPresets but not in the published form UI; "2 weeks from today" / "1 month from today" quick-set buttons would help
- **Duplicate brief detection** — no check for similar titles/categories from the same recruiter before publishing
- **Save-as-draft auto-focus** — after saving a draft, the page redirects to the audition list; an interim "Brief saved" confirmation toast would reduce uncertainty
- **Real-time preview** — brief detail preview while building the form is not yet available

---

## Manual Test Checklist

### New casting brief form (`/recruiter/auditions/new`)

- [ ] Page eyebrow reads "New casting brief"
- [ ] h1 reads "Build a casting call that attracts the right Talent."
- [ ] Supporting body copy mentions "Clear requirements, honest compensation, and a safe process"
- [ ] Recruiter access widget reads "Approved to publish" (not "Ready to publish")
- [ ] Error block (trigger by submitting an invalid form): amber border and background, no red
- [ ] Audition title field shows helper text: "Include the role type and project — be specific enough..."
- [ ] Location field shows helper text: "Talent use location to decide whether they can attend in person."
- [ ] Languages field shows helper text: "Comma-separated. Leave blank if the role is open to any language."
- [ ] Role description textarea shows helper text: "Talent uses this to decide if the role fits their skills..."
- [ ] Requirements textarea shows helper text: "Be specific but fair — only list requirements..."
- [ ] Self-tape instructions textarea (when self-tape enabled) shows safety note: "Do not ask Talent to contact you directly outside Nata Connect..."
- [ ] Max duration field label reads "Clip duration limit (seconds)"
- [ ] Max duration field shows helper text: "Optional. For example, 90 means each submission..."
- [ ] Application deadline field shows helper text: "Give Talent at least 7 days to prepare and apply."
- [ ] Pay information field shows helper text: "Specific compensation helps Talent make an informed decision..."
- [ ] Compensation type shows helper text: "Paid = formal rate; Honorarium = token payment; Unpaid = credit or experience only."
- [ ] "Before you publish" checklist: "Never ask Talent to pay to audition" renders in `font-bold`
- [ ] DevFormPresets panel works — fills form correctly; clear resets to empty
- [ ] "Publish audition" publishes and redirects to `/recruiter/auditions`
- [ ] "Save as draft" saves and redirects to `/recruiter/auditions`
- [ ] Submitting without a deadline shows a deadline validation error
- [ ] Unverified recruiter redirected to `/recruiter/verification`

### Recruiter auditions list (`/recruiter/auditions`)

- [ ] WorkspaceHero primary CTA reads "Post a casting brief"
- [ ] Empty state title reads "No casting briefs yet"
- [ ] Empty state message mentions "Verified recruiters see stronger applicant response."
- [ ] Empty state action reads "Post a casting brief"
- [ ] MetricCards (Active calls, Total applicants, Self-tape briefs, Drafts) — unchanged
- [ ] SafetyNotice visible below the audition table — unchanged

### Recruiter verification (`/recruiter/verification`)

- [ ] Description now reads "...Verified recruiters can publish casting briefs and build Talent trust with a verified badge on every listing."
- [ ] Form fields, submit button, and status badge — all unchanged

---

## Firebase Deploy Notes

No Firestore rules, indexes, or Cloud Functions were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required for the following changed pages and components:

- `app/recruiter/auditions/new/page.tsx` (new casting brief form)
- `app/recruiter/auditions/page.tsx` (casting list CTA and empty state)
- `app/recruiter/verification/page.tsx` (description copy)

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/recruiter/auditions/new/page.tsx` | Edited — header copy, error amber, Input helper prop, field helpers, self-tape safety note, checklist font-bold |
| `app/recruiter/auditions/page.tsx` | Edited — WorkspaceHero CTA, empty state title/message/action |
| `app/recruiter/verification/page.tsx` | Edited — description connects verification to publishing trust |
| `RECRUITER_AUDITION_PUBLISHING_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
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
