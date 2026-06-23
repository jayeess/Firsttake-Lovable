# Admin Operations Hardening Report

**Date:** June 23, 2026
**Pass:** Production Data & Admin Operations Hardening
**Status:** Complete — lint clean, 70/70 tests passing, production build passing

---

## Objective

Strengthen the admin workspace for managing real private beta users safely and efficiently. The focus is on:

- Removing unnecessary exposure of raw internal identifiers (UIDs) in admin UI
- Making queue urgency immediately obvious without scanning the whole page
- Replacing the last remaining HTML table with the consistent card-row pattern
- Adding `emailVerified` state visibility to user records
- Replacing a raw JSON evidence dump with a readable structured display

This pass did not change APIs, Firestore rules, authentication logic, or admin action enforcement. All existing `AdminActionButton` required-reason checks remain in place.

---

## Files Changed

### 1. `app/admin/reports/page.tsx`

**Problem 1 — Reporter UID exposure**

The reporter info field was rendering:
```
talent / abc123xyzFirebaseUID...
```
The raw Firebase UID of the reporter was visible in the UI. Admins do not need the reporter's UID — they need the role (talent or recruiter) to understand the report context. A UID visible in screenshots or recordings could be used to correlate the reporter across contexts.

**Fix:** The `Reporter` field now shows only `report.reporterRole` (e.g., "talent").

---

**Problem 2 — Target owner UID shown in full**

The "Target owner" field was rendering the full Firebase UID of the reported party. While the admin legitimately needs to identify the target, the full UID is not necessary in the summary view — enforcement actions already handle targeting correctly via `report.id`.

**Fix:** Target owner now shows only the last 8 characters: `…abc12345`. This is enough to cross-reference if needed without broadcasting the full UID.

---

**Problem 3 — Raw JSON evidence dump**

The "Safe evidence snapshot" section was rendering:
```tsx
<pre>{JSON.stringify(report.evidenceSnapshots, null, 2)}</pre>
```
This dumped the full evidence object as raw JSON, which:
- Exposed any internal IDs embedded in the snapshot
- Was unreadable at a glance
- Could surface field names that are sensitive

**Fix:** Added a `SafeEvidenceDisplay` component that:
- Renders evidence as a key/value list (readable, not raw JSON)
- Automatically replaces values in fields ending with `id` or `uid` with `[internal reference]`
- Truncates string values longer than 200 characters
- Shows `[nested data]` for objects rather than recursively dumping them
- Handles null/undefined evidence gracefully

---

**Problem 4 — Audit trail actor UID**

The report event audit trail was rendering:
```
approve_recruiter by abc123FirebaseUID
```
Since all actors in a report's audit trail are platform admins (actions are protected by `requireAdmin`), showing the UID adds no practical information and exposes admin account UIDs in a context that may be visible in recordings.

**Fix:** The audit trail now renders:
```
approve recruiter — Admin
```
The action is formatted human-readable (underscores replaced with spaces), and the actor is shown as "Admin" since all actors in this context are verified admin accounts.

---

### 2. `app/admin/users/page.tsx`

**Problem 1 — Desktop HTML table**

The desktop view used a `<table>` element — the only remaining HTML table in the admin workspace. This was inconsistent with all other admin list pages (verifications, talents, auditions, reports, audit logs, beta-feedback) which all use card-row or article-based layouts.

**Fix:** Replaced the HTML table with a flex card-row layout matching the other admin pages:
- Each user is an `<article>` with email, UID (break-all), role chip, status badge, and action buttons
- Hover state not added (users page doesn't need edit-detail expansion, just inline actions)
- The mobile card view (`UserCard`) is unchanged except for the emailVerified addition below

---

**Problem 2 — No email verification state**

The `UserRow` type had no `emailVerified` field, and the status tone function only distinguished `SUSPENDED` from everything else. An ACTIVE user who has not verified their email looked identical to a fully verified active user.

**Fix:**
- Added `emailVerified?: boolean` to `UserRow` type
- Updated `statusTone` signature to accept `(status, emailVerified)`:
  - `SUSPENDED` → `danger`
  - `emailVerified === false` (explicitly false, not undefined) → `attention`
  - Otherwise → `success`
- Added an "Email unverified" `attention` badge when `emailVerified === false` on both desktop and mobile views
- `emailVerified === false` (strict equality) prevents false `attention` badges when the field is simply absent from older records

---

### 3. `app/admin/page.tsx`

**Problem 1 — No urgency callout**

The dashboard showed pending recruiter and Talent verification counts in metric cards at the top, but the page gave no explicit signal that something needed action now. An admin scanning the page quickly could miss that there were 3 pending recruiter verifications.

**Fix:** Added an amber urgency callout banner that appears only when `pendingVerifications > 0 || pendingTalentVerifications > 0`. It reads "Action needed now" with a precise count: e.g., "2 recruiter verifications pending · 1 Talent check pending". The banner is hidden when all queues are empty.

---

**Problem 2 — Unordered stats grid**

The operational summary section used `Object.entries(data.stats)` to render all stats. JavaScript object key iteration order is technically insertion order, but this was implicit and unverifiable at a glance. Stats like `selfTapeRequests` and `selfTapeSubmissions` appeared at the end of an undefined-seeming list.

**Fix:** Replaced `Object.entries(data.stats)` with an explicit curated ordered key list:
1. Total users
2. Talent accounts
3. Recruiters
4. Approved recruiters
5. Active auditions
6. Applications
7. Self-tape auditions
8. Self-tapes submitted

This preserves all the useful stats while making their priority explicit and dropping `pendingVerifications`, `pendingTalentVerifications`, and `suspendedUsers` from the stats grid (they already appear in the top metric cards and the "Needs attention first" queue links).

---

## What Was Not Changed

- **Admin action enforcement**: All `AdminActionButton` required-reason checks are unchanged. The list of actions requiring a reason (suspend, reject, remove, block, etc.) is unchanged.
- **Firestore rules**: No security rules were changed.
- **API routes**: No server-side data routes were changed.
- **Authentication logic**: No auth flows or admin claim checks were changed.
- **Admin verifications page**: Already strong — pending items use amber border highlight, audit trail links present.
- **Admin talents page**: Already strong — trust signals, completeness, media separation all clearly distinguished.
- **Admin auditions page**: Already strong — active/removed color-coding, search, SafetyNotice present.
- **Admin beta-feedback page**: Already strong from Pass 1 — severity sort, blocking count, type filter all in place.
- **Admin audit-logs page**: Already strong — `formatAuditActionLabel` and `getAuditActionTone` provide readable, color-coded log entries.

---

## Before / After Summary

| Area | Before | After |
|------|--------|-------|
| Reports: reporter field | `talent / abc123UID` | `talent` (role only) |
| Reports: target owner | Full Firebase UID | `…last8chars` |
| Reports: evidence snapshot | Raw `JSON.stringify` dump | Structured key/value with UID redaction |
| Reports: audit trail actor | `approve_recruiter by abc123UID` | `approve recruiter — Admin` |
| Users: desktop layout | HTML `<table>` | Card-row `<article>` layout |
| Users: email verification | Not visible | `attention` badge when `emailVerified === false` |
| Users: status tones | SUSPENDED=danger, else success | SUSPENDED=danger, unverified email=attention, else success |
| Dashboard: urgency | No callout — requires reading metric cards | Amber banner when queues have pending items |
| Dashboard: stats order | Implicit `Object.entries` order | Explicit curated priority order |

---

## Manual Checks Recommended

After deploying:

- [ ] Open `/admin/reports` — Reporter shows role only, no UID. "Safe evidence snapshot" shows key/value pairs, no raw JSON. Audit trail shows "Admin" not UID.
- [ ] Open `/admin/users` on desktop — card-row layout, no HTML table. Suspended users show red badge, unverified email shows amber badge.
- [ ] Open `/admin` with pending verifications — amber "Action needed now" banner appears with correct count.
- [ ] Open `/admin` with no pending verifications — amber banner is absent.
- [ ] Confirm all admin action buttons still require a reason for destructive actions.

---

## Test Results

```
npm run lint   → Clean
npm test       → 70 / 70 pass
npm run build  → Success, 55 routes, 0 errors
```

---

## Deployment Notes

No Firestore rules, indexes, or schema changes. Vercel redeploy required for UI changes.
