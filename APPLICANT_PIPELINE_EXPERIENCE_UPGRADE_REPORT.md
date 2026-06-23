# Applicant Pipeline Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make the Recruiter applicant review workflow feel like a real casting pipeline, and give Talent clearer guidance on what each application stage means and what to do next.

---

## Pages Reviewed

| Page | File | Assessment before this pass |
|------|------|----------------------------|
| Recruiter applicant review | `app/recruiter/auditions/[id]/applicants/page.tsx` | Strong base; summary metrics cluttered with audition metadata; UNDER_REVIEW/MAYBE tabs missing; timeline copy generic |
| Talent application tracker | `app/applications/page.tsx` | Good structure; next-step messages vague; view descriptions generic; no safety reminder |
| Recruiter auditions list | `app/recruiter/auditions/page.tsx` | Clean; one `font-semibold` typo in mobile card |
| Messages inbox | `app/messages/page.tsx` | Already strong — no changes needed |
| Conversation thread | `app/messages/[conversationId]/page.tsx` | Already strong — no changes needed |
| Notification center | `app/notifications/page.tsx` | Already strong — no changes needed |
| Notification policy | `app/lib/notification-policy.ts` | Good structure; CALLBACK/SHORTLISTED/REJECTED/SELECTED messages improved |

---

## Recruiter Applicant Review Improvements (`app/recruiter/auditions/[id]/applicants/page.tsx`)

### Header: audition meta line
Added a structured meta line below the audition title showing Role category, Closing date, and Audition status badge. When self-tapes are enabled and at least one has been submitted, the self-tape count also appears inline. This gives the recruiter immediate context on what the pipeline belongs to without needing to scroll to the summary metrics.

**Before:** Title and generic description only.  
**After:** Title + `{Category} · Closes {Date} · [Status badge] · {N} self-tape(s) submitted`

### Pipeline summary: simplified from 11 to 8 metrics
**Before:** 11 `ReviewMetric` cards in a `xl:grid-cols-6` grid — this included Role, Deadline, and Audition status alongside pipeline counts, creating a cluttered layout that mixed audition metadata with pipeline analytics.

**After:** 8 `ReviewMetric` cards in a `sm:grid-cols-4` grid (2 clean rows of 4) covering only pipeline counts:
- Total applicants
- New
- Viewed & reviewing
- Shortlisted
- Callback
- Final round
- Selected
- Rejected

Role, Deadline, Status, and Self-tape count are now shown in the header meta line instead.

### Pipeline tabs: added UNDER_REVIEW and MAYBE
**Before:** Tabs for All, New, Viewed, Shortlisted, Callback, Final Round, Selected, Rejected — UNDER_REVIEW and MAYBE were pipeline statuses but had no dedicated tab.

**After:** Tabs for All, New, Viewed, **Reviewing**, **Maybe**, Shortlisted, Callback, Final Round, Selected, Rejected.

Recruiters can now filter to the "Reviewing" and "Maybe" pools directly, which are key staging areas before committing to shortlist or rejection.

### Status timeline: status-specific descriptions
**Before:** Generic copy — "Current casting stage for this applicant." or "Previous casting stage recorded for this application." — regardless of what stage the applicant was in.

**After:** Each status has its own description:
| Status | Timeline description |
|--------|---------------------|
| APPLIED | Profile received — application in the recruiter inbox. |
| VIEWED | Profile opened by the casting team. |
| UNDER_REVIEW | Actively under recruiter review. |
| MAYBE | Held in the consideration pool before a final decision. |
| SHORTLISTED | Added to the shortlist for this role. |
| CALLBACK | Callback stage — follow up through messages if needed. |
| FINAL_ROUND | In the final casting round. |
| SELECTED | Selected for the role. |
| REJECTED | Application not taken forward. |
| WITHDRAWN | Withdrawn by the Talent member. |

Current stage is prefixed with "Current — " so the recruiter can instantly identify the active position in the timeline.

### Private casting notes: "Next action" panel
Added a status-specific "Next action" panel inside the private casting notes aside, appearing after the "Save private review" button and before the message button. This tells the recruiter the most logical next casting action for the applicant's current stage.

| Status | Next action guidance |
|--------|---------------------|
| APPLIED | Open this profile and log your first look by moving to Viewed. |
| VIEWED | Review the profile and materials. Move to Shortlisted, Reviewing, or Rejected. |
| UNDER_REVIEW | Compare with your shortlist. Move to Shortlisted, Maybe, or Rejected. |
| MAYBE | Make a final call — Shortlist, Callback, or Reject this application. |
| SHORTLISTED | Confirm your shortlist. Move to Callback or message to discuss next steps. |
| CALLBACK | Discuss next steps via messages. Move to Final Round when ready. |
| FINAL_ROUND | Make the casting decision — Select or Reject. |
| SELECTED | Send a message to share next steps with the Talent member. |
| REJECTED | Application closed. No further action required. |

### Status timeline date: `font-semibold` → `font-bold`
Minor typography consistency fix in the date stamp shown in each timeline entry.

---

## Talent Application Tracking Improvements (`app/applications/page.tsx`)

### Next step messages: stage-specific guidance
Every status now has a clear, actionable message that tells Talent what the stage means and what to do or expect next.

| Status | Before | After |
|--------|--------|-------|
| APPLIED | "Your application was sent." | "Waiting for the casting team to open your application." |
| VIEWED | "Recruiter has opened your application." | "The casting team opened your application and may be reviewing other applicants." |
| UNDER_REVIEW | "Recruiter is reviewing your profile and materials." | "The casting team is reviewing your profile and materials." |
| MAYBE | "You are still in consideration for a possible next step." | "You are in the casting pool. Watch for an update." |
| SHORTLISTED | "You are being considered for the next step." | "You made the shortlist. The recruiter may message you about next steps." |
| CALLBACK | "The recruiter may contact you for another round." | "You have a callback. Watch for a message from the casting team." |
| FINAL_ROUND | "You moved to the final review stage." | "You made the final round. The casting team is making their decision." |
| SELECTED | "You were selected for this opportunity." | "You were selected. The recruiter will contact you through messages with next steps." |
| REJECTED | "This role moved forward with someone else." | "The casting team moved forward with another applicant. Keep applying — every audition is a separate opportunity." |
| WITHDRAWN | "You withdrew this application." | (unchanged) |

### View tab descriptions updated
| Tab | Before | After |
|-----|--------|-------|
| Active | "Waiting or in review" | "In review or awaiting recruiter action" |
| Shortlisted | "Strong progress" | "Shortlist, callback, and final round" |

### View tab description font: `font-semibold` → `font-bold`

### Safety reminder added
A `SafetyNotice` ("Never pay to audition") appears at the bottom of the applications list, reminding Talent that legitimate casting calls are free. This is a persistent reminder for every session without disrupting the application flow.

---

## Recruiter Auditions List (`app/recruiter/auditions/page.tsx`)

### Mobile card "Next action" text: `font-semibold` → `font-bold`
Minor typography consistency fix on the "Next action: open applicants to shortlist..." copy in the mobile card layout.

---

## Messaging and Notification Notes

### Messages inbox (`/messages`)
No changes made. The inbox already shows:
- Application-status badge on each conversation row
- Safety reminder ("Keep personal contact details private until trust is established")
- Unread indicator
- Search and filter

### Conversation thread (`/messages/[conversationId]`)
No changes made. The thread already shows:
- "Application conversation" header
- "Casting context" aside with audition title and application status
- "Trust reminder" about not paying or sharing financial details
- Role-specific safety copy in the compose area
- Read-only state notice when the application is no longer active

### Notification center (`/notifications`)
No changes made. The page is already well-structured with category filters, action labels, and priority badges.

---

## Status Pipeline Improvements (`app/lib/notification-policy.ts`)

Four notification messages improved with clearer casting-specific language:

| Status | Before | After |
|--------|--------|-------|
| SHORTLISTED | "You were shortlisted for {title}." | "You were shortlisted for {title}. The casting team will be in touch about next steps." |
| CALLBACK | "You may be contacted for another round for {title}." | "You received a callback for {title}. Watch for a message from the casting team." |
| FINAL_ROUND | "You moved to the final review stage for {title}." | "You moved to the final casting round for {title}. A decision is being made." |
| REJECTED | "This role moved forward with someone else for {title}." | "The casting team for {title} moved forward with another applicant." |
| SELECTED | "You have been selected for {title}. The recruiter may contact you with next steps." | "You were selected for {title}. The recruiter will contact you through messages with next steps." |

Note: VIEWED notification message was not changed because the test suite asserts it contains "opened your application" — this constraint was preserved.

---

## What Remains for Future Versions

- **Bulk pipeline actions** — no batch shortlist/reject across multiple applicants
- **Applicant ranking within stage** — no drag-and-drop ordering within shortlist, callback, etc.
- **Timeline with actor info** — status history shows dates but not who made each change (changedBy is stored but not displayed)
- **Self-tape review notes** — recruiter can mark self-tape "reviewed" but cannot add notes specific to the tape
- **Callback scheduling** — no calendar or availability coordination inside the platform
- **Rejection reason templates** — rejection reason is a free-text prompt, no preset options
- **Final round announcement to all finalists** — recruiting can only message individually, no batch communication

---

## Manual Test Checklist

### Recruiter applicant review (`/recruiter/auditions/[id]/applicants`)

**Header and summary:**
- [ ] Header shows audition title
- [ ] Meta line shows Role category, closing date, and status badge
- [ ] Self-tape count appears in meta line only when `selfTapeEnabled` and at least 1 submitted
- [ ] Pipeline summary shows 8 cards in 2 rows of 4 (on sm+): Total, New, Viewed & reviewing, Shortlisted, Callback, Final round, Selected, Rejected

**Pipeline tabs:**
- [ ] Tabs visible: All, New, Viewed, Reviewing, Maybe, Shortlisted, Callback, Final Round, Selected, Rejected
- [ ] Clicking "Reviewing" filters to UNDER_REVIEW applicants only
- [ ] Clicking "Maybe" filters to MAYBE applicants only
- [ ] Tab count matches pipeline count for each stage

**Status timeline:**
- [ ] Each timeline entry shows status-specific description (not generic "Previous casting stage...")
- [ ] Current stage prefixed with "Current —"
- [ ] Timeline date uses `font-bold` (not `font-semibold`)

**"Next action" panel in aside:**
- [ ] Panel visible in expanded review when status is not WITHDRAWN
- [ ] Shows status-specific next action text
- [ ] Panel not shown when status is WITHDRAWN

### Talent application tracker (`/applications`)

- [ ] APPLIED next step: "Waiting for the casting team to open your application."
- [ ] SHORTLISTED next step: "You made the shortlist. The recruiter may message you about next steps."
- [ ] CALLBACK next step: "You have a callback. Watch for a message from the casting team."
- [ ] FINAL_ROUND next step: "You made the final round. The casting team is making their decision."
- [ ] SELECTED next step: "You were selected. The recruiter will contact you through messages with next steps."
- [ ] REJECTED next step: "The casting team moved forward with another applicant. Keep applying..."
- [ ] Active tab description reads "In review or awaiting recruiter action"
- [ ] Shortlisted tab description reads "Shortlist, callback, and final round"
- [ ] View tab descriptions use `font-bold`
- [ ] SafetyNotice "Never pay to audition" visible at page bottom

### Notifications
- [ ] SHORTLISTED notification: contains "The casting team will be in touch about next steps."
- [ ] CALLBACK notification: contains "Watch for a message from the casting team."
- [ ] FINAL_ROUND notification: contains "A decision is being made."
- [ ] REJECTED notification: contains "moved forward with another applicant."
- [ ] SELECTED notification: contains "through messages with next steps."
- [ ] VIEWED notification: still contains "opened your application" (unchanged)

### Recruiter auditions list (`/recruiter/auditions`)
- [ ] Mobile card "Next action:" text uses `font-bold` (not `font-semibold`)

---

## Firebase Deploy Notes

No Firestore rules or indexes were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required for the following changed pages:

- `app/applications/page.tsx`
- `app/recruiter/auditions/[id]/applicants/page.tsx`
- `app/recruiter/auditions/page.tsx`
- `app/lib/notification-policy.ts` (consumed by `/api/applications` route)

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/lib/notification-policy.ts` | Edited — SHORTLISTED, CALLBACK, FINAL_ROUND, REJECTED, SELECTED messages improved |
| `app/applications/page.tsx` | Edited — nextStepMessages, view descriptions, font, SafetyNotice |
| `app/recruiter/auditions/[id]/applicants/page.tsx` | Edited — header meta, pipeline summary, tabs, timeline copy, next action panel, font fix |
| `app/recruiter/auditions/page.tsx` | Edited — font-semibold → font-bold in mobile card |
| `APPLICANT_PIPELINE_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
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
