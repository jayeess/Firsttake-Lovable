# Design System Evolution Report

**Date:** June 22, 2026
**Pass:** Cinematic Trust Marketplace / Casting Operating System
**Status:** Complete — lint clean, 70/70 tests passing, production build passing

---

## Design Direction

**Target style:** Cinematic Trust Marketplace / Casting Operating System

FirstTake / Nata Connect should feel like a premium film-industry casting workspace — not a generic SaaS app, not a social media app, and not a job portal. The visual language draws from:

- Dark navy (`#07111f`) for authority and professionalism
- Teal (`#008ca6`, `#00c2e0`) for trust, verification, and progression
- Cinema gold (`#e7ad2d`, `#ffd66d`) for advancement, shortlisting, and CTAs
- Muted teal-grey surface (`#eef4f7`) for workspace calm
- Emerald for success/selected states
- Brand palette borders on all chips (no bare Tailwind color classes)

The Telugu brand text **నట కనెక్ట్** was preserved throughout.

---

## Pages Reviewed

| Page | Reviewed |
|------|----------|
| `components/product-ui.tsx` | ✓ |
| `components/app-shell.tsx` | ✓ |
| `components/admin-shell.tsx` | ✓ |
| `components/status-badge.tsx` | ✓ — redesigned |
| `components/audition-card.tsx` | ✓ — redesigned |
| `components/email-verification-prompt.tsx` | ✓ |
| `app/dashboard/page.tsx` | ✓ |
| `app/auditions/page.tsx` | ✓ |
| `app/applications/page.tsx` | ✓ — improved |
| `app/messages/page.tsx` | ✓ |
| `app/messages/[conversationId]/page.tsx` | ✓ |
| `app/notifications/page.tsx` | ✓ |
| `app/recruiter/auditions/page.tsx` | ✓ — improved |
| `app/recruiter/auditions/new/page.tsx` | ✓ |
| `app/recruiter/auditions/[id]/applicants/page.tsx` | ✓ — improved |
| `app/admin/page.tsx` | ✓ |
| `app/admin/verifications/page.tsx` | ✓ |
| `app/admin/talents/page.tsx` | ✓ |
| `app/admin/auditions/page.tsx` | ✓ |

---

## Components Improved

### 1. `components/status-badge.tsx` — Complete redesign

**Before:** Generic Tailwind color classes (`green-100 text-green-800`, `blue-100 text-blue-800`, etc.) with no border, no rounded corners, inconsistent sizing, `font-semibold`.

**After:** Brand-aligned color system with:
- Every badge has `border` + `rounded-md` + `text-[10px] font-black uppercase tracking-wide`
- **Audition lifecycle:** ACTIVE (teal), DRAFT (gold), CLOSED/WITHDRAWN (neutral grey), CANCELLED (muted red)
- **Submission tier:** APPLIED (steel-blue), VIEWED (amber), UNDER_REVIEW (deep amber), MAYBE (lavender)
- **Casting advancement tier (gold progression):** SHORTLISTED → CALLBACK → FINAL_ROUND each step deeper gold
- **Conclusions:** SELECTED (emerald), REJECTED (muted red), WITHDRAWN (neutral)

The gold advancement arc (SHORTLISTED → CALLBACK → FINAL_ROUND) is now visually readable as a progression — each step darker gold toward the final decision.

### 2. `components/audition-card.tsx` — Complete redesign

**Before:** Flat card with mixed tag styles (some `rounded-md`, some not), no hover shadow, `border-[#e5e8e5]` footer divider, generic "View details" CTA, plain icon-free tags.

**After:**
- `group` hover: `-translate-y-0.5 hover:shadow-md hover:border-[#008ca6]`
- **Cinematic left-border accent**: invisible by default, teal on hover, gold when the role is already applied to
- New `Chip` component with 6 variants (trust, new, urgent, category, selftape, neutral) — all `rounded-md` with brand-palette borders and backgrounds
- `MapPin` icon in location chip, `Video` icon in self-tape chip
- `text-[10px] font-black uppercase tracking-wide` tag sizing — consistent with StatusBadge
- CTA changed from `"View details"` → `"View casting brief"` (casting-industry language)
- Bookmark button: `rounded-md`, `hover:border-[#008ca6]`

### 3. `components/product-ui.tsx` — WorkspaceHero cinematic depth

**Before:** Gold left-border stripe on white background, no depth.

**After:** Added a `pointer-events-none` radial teal gradient at top-right (`rgba(0,194,224,0.07)`) — subtle cinematic glow that gives the header visual depth without being distracting. The gold stripe and white background are unchanged.

### 4. `app/recruiter/auditions/page.tsx` — Desktop layout redesign

**Before:** Raw HTML `<table>` with flat thead/tbody, generic column headers (`Audition`, `Status`, `Deadline`, `Applicants`, `Action`), `font-semibold` text, no hover state.

**After:** Card-row layout using `<article>` elements with:
- `group` hover: `-translate-y-0.5 hover:border-[#008ca6] hover:shadow-md`
- Title text changes to teal on hover via `group-hover:text-[#008ca6]`
- StatusBadge + self-tape chip inline with title
- Deadline and applicant count in a compact row with `·` separator
- Clear primary/secondary action buttons per row (`Review applicants` / `View brief`)
- Consistent with the mobile card view — no longer two different design languages

### 5. `app/applications/page.tsx` — ApplicationMeta + Next step panel

**Before:** `ApplicationMeta` used `border-[#e1e6ea] bg-white p-3` with `text-xs` label. "Next step" was a flat teal-bordered div.

**After:**
- `ApplicationMeta`: `bg-[#f7fafb]` surface, `text-[10px] font-black uppercase tracking-wide` label, `text-sm font-black text-[#07111f]` value — consistent with global chip sizing
- "Next step" panel: gained a small teal dot indicator `•` before the label, teal border, teal-muted background — more premium casting-board feel

### 6. `app/recruiter/auditions/[id]/applicants/page.tsx` — Talent metadata chips

**Before:** Talent identity metadata (category, location, completeness, languages, skills, media count) displayed as plain unstyled `<span>` elements with `text-sm font-semibold`, no visual separation.

**After:** New `TalentChip` component with three tones:
- `neutral` — `bg-[#f4f6f8]` neutral chip (category, location, languages, skills)
- `score` — teal chip for completeness percentage
- `media` — gold chip for media count
Consistent with the `Chip` component in audition-card and StatusBadge sizing.

---

## UI Patterns Standardized

| Pattern | Standard |
|---------|----------|
| Status badges | `rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide` |
| Metadata/tag chips | `rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide` |
| Card hover | `hover:-translate-y-0.5 hover:border-[#008ca6] hover:shadow-md` |
| Card left-border accent | `absolute inset-y-0 left-0 w-0.5` — teal on hover, gold when applied |
| Eyebrow text | `.eyebrow` class (pre-existing) |
| Hero header | `WorkspaceHero` — gold stripe + teal radial glow |
| Surface cards | `.surface` class (pre-existing) |
| Primary CTA | `.primary-button` — navy with teal hover |
| Trust chips | Teal border/bg palette |
| Advancement chips | Gold border/bg palette |

---

## Before/After Intent

| Area | Before | After |
|------|--------|-------|
| Status badges | Generic green/blue/amber Tailwind | Brand-aligned gold/teal/neutral arc |
| Audition cards | Mixed chip styles, "View details" | Consistent chips, "View casting brief", hover accent |
| Recruiter auditions desktop | Raw HTML table | Card-row layout matching mobile |
| WorkspaceHero | White + gold stripe | White + gold stripe + teal radial glow |
| Application meta | Bare white boxes | Surface chips with brand label sizing |
| Applicant talent chips | Unstyled spans | Brand-palette chips (neutral/score/media) |

---

## What Was Fixed

- StatusBadge color system now uses brand palette, not generic Tailwind colors
- Audition cards feel like a casting marketplace, not a job board
- Desktop recruiter auditions view matches the mobile card language
- WorkspaceHero has subtle cinematic depth
- Application meta and "next step" panel feel like part of the same system
- Talent metadata chips in applicant review are readable and scannable

---

## What Remains for Future Design

- **AppShell sidebar** — already strong (dark navy, gold mark, teal active state); no changes needed now
- **AdminShell** — already strong; the nav group structure is well-organized
- **Messages `[conversationId]` page** — chat bubbles could use a stronger cinematic feel; deprioritized to avoid breaking the conversation UX
- **Notifications page** — icon coloring per notification type could be more expressive; currently functional
- **Public-facing pages** (`/`, `/help`, `/safety`) — cinematic hero sections; out of scope for this pass
- **Talent/Recruiter profile forms** — dense forms with many fields; a separate form-design pass is recommended
- **Admin UI components** (`AdminStatusBadge`) — separate badge system from user-facing StatusBadge; could be unified in a future pass

---

## Mobile Risk Notes

- All changed components (`status-badge`, `audition-card`, `product-ui`) were mobile-first
- The recruiter auditions desktop layout change is `lg:hidden` / `hidden lg:block` — mobile card view is **unchanged**
- `TalentChip` and `Chip` use `inline-flex` — wraps safely on small screens
- Bottom nav safe-area padding was not touched
- No horizontal overflow introduced (all chip containers use `flex-wrap`)

---

## Firebase / Firestore

No Firestore rules, indexes, schemas, or API routes were changed. Firebase deploy is **not required**.

---

## Deployment Notes

- Vercel redeploy **is required** to pick up UI changes
- No environment variables changed
- No new dependencies added
- All changes are frontend/component only

---

## Manual Checks Recommended

After deploying:

- [ ] Open `/auditions` — confirm card chips all have `rounded-md`, hover shows teal left-border, "View casting brief" CTA visible
- [ ] Open `/auditions/[id]` — status badge uses brand palette (no `green-100`, `blue-100`)
- [ ] Open `/applications` — Application meta uses dark label text, "Next step" has teal dot indicator
- [ ] Open `/recruiter/auditions` on desktop — card rows visible, no HTML table
- [ ] Open `/recruiter/auditions/[id]/applicants` — talent metadata shows as branded chips
- [ ] Open `/dashboard` — WorkspaceHero hero has subtle teal gradient at top-right
- [ ] Open `/messages` — StatusBadge on conversation cards renders with new palette
- [ ] Mobile: bottom nav intact, cards wrap correctly, no overflow
