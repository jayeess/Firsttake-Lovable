# Audition Share Kit and Public Opportunity Page — Pass 26 Report

**Date:** June 30, 2026
**Commit message:** Add audition share kit and public opportunity page
**Branch:** main (do not commit automatically)

---

## Goal

Build a transparent, rule-based way for recruiters to share auditions publicly
and for Talent to see safer public opportunity context before applying. Make
FirstTake more shareable and growth-ready.

### What success looks like

- Recruiters share one clean audition link instead of WhatsApp posters.
- Talent understand the role, source, safety context, and apply path faster.
- FirstTake grows naturally through shared casting opportunities.
- Public opportunities feel more professional than Instagram or WhatsApp flyers.
- Platform strengthens trust through brief quality, recruiter source
  transparency, and safe apply guidance.

---

## Design principles applied

| Principle | Application |
| --- | --- |
| Transparent | Share readiness band, headline, and checklist are rule-based and explainable |
| Non-AI | No scoring model, no automatic ranking, no "AI-verified" language |
| Guidance-first | Missing items show what to improve, not a block |
| Privacy-safe | No private recruiter documents, private Talent data, admin notes, or moderation records exposed |
| Not a legal certificate | Disclaimer is shown on every opportunity page panel |
| Not a casting guarantee | All copy avoids "guaranteed", "selected", "best", "certified" language |

---

## Files changed

### New

| File | Purpose |
| --- | --- |
| `app/lib/audition-share-kit-policy.ts` | Self-contained share kit policy module |
| `tests/audition-share-kit-policy.test.mts` | 26 test cases |
| `AUDITION_SHARE_KIT_PUBLIC_OPPORTUNITY_PAGE_REPORT.md` | This file |

### Modified

| File | Change |
| --- | --- |
| `app/auditions/[id]/page.tsx` | Added `OpportunityShareKitPanel` and `shareKitBandClass` |
| `app/recruiter/auditions/page.tsx` | Added `ShareReadinessPill` to mobile and desktop views, improvement tips |
| `CHANGELOG.md` | Pass 26 entry |
| `TESTING.md` | Pass 26 verification checklist |
| `PRODUCT_STATUS_AND_ROADMAP.md` | Stage update, new maturity row |
| `FULL_APP_UX_POLISH_REPORT.md` | Pass 26 section |

---

## Policy: `app/lib/audition-share-kit-policy.ts`

### Share readiness bands

| Band | Trigger |
| --- | --- |
| `needs_trust_review` | Payment request language, off-platform contact pressure, or expired deadline |
| `needs_brief_detail` | Any core field missing: title, description, category, location, requirements |
| `good_opportunity_page` | Core fields present; optional items (source, compensation, self-tape) missing |
| `share_ready` | All 11 checklist items complete |

### Checklist items (11)

1. `title` — Must be ≥ 14 chars with at least one space
2. `description` — Must be ≥ 100 chars
3. `category` — Must be set
4. `location` — Location text or workMode must be present
5. `deadline` — Must be in the future
6. `compensation` — paymentType (not UNSPECIFIED) or payInfo
7. `requirements` — Must be ≥ 45 chars
8. `self_tape` — If selfTapeRequired, selfTapeInstructions must be ≥ 40 chars
9. `source` — recruiterProfile.companyName or recruiterName
10. `payment_safety` — No payment request language patterns
11. `communication_safety` — No off-platform contact pressure patterns

### Share copy safety

- Templates use factual language only: role, category, location, deadline, apply path.
- No "best opportunity", "guaranteed", "certified", or "AI" language.
- `needs_trust_review` returns a single guidance string, not a real template.

### Public safety notes

1. Casting calls on Nata Connect are free to apply to.
2. Keep all casting communication on-platform.
3. Self-tape links must be external links submitted through My Applications only. _(inserted at index 2 if selfTapeEnabled)_
4. Never share financial details or sensitive personal documents as part of audition consideration.
5. This opportunity page is platform context, not a guarantee of casting or selection.

### Disclaimer

> "This opportunity page is platform context, not a guarantee of casting or
> selection. Casting decisions are made by the recruiting team."

---

## UI: `/auditions/[id]` — `OpportunityShareKitPanel`

The panel appears after `CastingBriefTrustPanel` for all authenticated users.

**Visible to all authenticated users:**
- Band badge (color-coded by readiness)
- Structured summary: casting source, category, location, deadline, compensation
- Self-tape note (amber, conditional on `selfTapeEnabled`)
- Public safety notes (bullet list)
- Disclaimer (muted footer)

**Visible to owner (recruiter) only:**
- Share copy templates (3 plain-text variants, or guidance string for `needs_trust_review`)
- Missing item count tip with item names

---

## UI: `/recruiter/auditions` — `ShareReadinessPill`

Added to both views:

- **Mobile card view** — pill in the chips row, improvement tip below "Next action"
- **Desktop row view** — pill alongside Brief Quality and Source Transparency pills

`ShareReadinessPill` component uses the same pill styling pattern as
`BriefQualityPill` and `SourceTransparencyPill`.

---

## Tests: `tests/audition-share-kit-policy.test.mts`

26 test cases across 8 areas:

| Area | Tests |
| --- | --- |
| Band assignment | 9 tests (all four bands, core field variants) |
| Self-tape completeness | 2 tests |
| Share copy language safety | 2 tests |
| Public safety notes | 3 tests |
| Source transparency | 2 tests |
| `getAuditionShareReadiness` | 2 tests |
| `getPublicOpportunitySummary` | 2 tests |
| `getAuditionShareMissingItems` | 2 tests |
| `getAuditionShareCopyTemplates` | 1 test |
| `needs_trust_review` improvement tip | 1 test |

**Result: 260/260 pass (all suites)**

---

## Known limitation

No new public unauthenticated route (`/o/[id]`) was created. A fully public
opportunity page would require Firestore security rules changes to allow
unauthenticated reads of audition documents. Weakening security rules is outside
the scope of this pass and is flagged in the restrictions. The existing
`/auditions/[id]` authenticated route is enhanced instead.

**Future option:** When Firestore rules are reviewed for production, an
`/o/[id]` route could be added with limited public document fields (title,
category, location, deadline, recruiterName) and no private Talent or recruiter
data.

---

## Restrictions compliance

| Restriction | Status |
| --- | --- |
| No AI | Compliant |
| No "AI opportunity", "AI trust", "AI verification" | Compliant |
| No auto-ranking | Compliant |
| No payment/subscription | Compliant |
| No calendar scheduling | Compliant |
| No video calls | Compliant |
| No direct video upload | Compliant |
| No self-tape video upload | Compliant |
| Self-tapes remain external links | Compliant |
| No fake data or fake users | Compliant |
| No celebrity names | Compliant |
| No copyrighted project names | Compliant |
| No guaranteed casting/jobs claims | Compliant |
| No certificate language | Compliant |
| No private recruiter verification documents exposed | Compliant |
| No private Talent documents exposed | Compliant |
| No private admin notes, reports, or moderation data exposed | Compliant |
| No email or phone exposure | Compliant |
| No hidden media exposure | Compliant |
| Firebase/Auth/Admin security not weakened | Compliant |
| No secrets exposed | Compliant |
| `.env`, `.env.local`, `node_modules`, `.next`, service accounts not touched | Compliant |
| Do not commit automatically | Compliant |
