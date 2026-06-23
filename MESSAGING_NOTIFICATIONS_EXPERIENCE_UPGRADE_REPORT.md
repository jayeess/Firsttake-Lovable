# Messaging and Notifications Experience Upgrade Report

**Pass date:** June 23, 2026  
**Goal:** Make messaging and notifications feel like a professional casting communication center — not a generic inbox. Give Talent and Recruiters the context they need to understand casting conversations, act on application updates, and stay safe.

---

## Pages Reviewed

| Page | File | Assessment before this pass |
|------|------|----------------------------|
| Messages inbox | `app/messages/page.tsx` | Strong layout; conversation cards show audition context and StatusBadge; type chip was generic ("Recruiter conversation"); fallback last-message text "Conversation ready" was awkward; aside safety habits had "early" qualifier; Talent empty state was passive |
| Conversation detail | `app/messages/[conversationId]/page.tsx` | Strong thread + dark header; header eyebrow "Application conversation" was not role-aware; compose placeholder was generic ("Write a message"); compose error used red styling inconsistent with app; aside description was clinical; return link label was generic ("View linked application") |
| Notifications | `app/notifications/page.tsx` | Good tab structure and category icons; `font-semibold` on timestamp; per-category unread counts only shown for ALL tab; error block used red styling; empty state copy was the same for all filter tabs |
| Notification policy | `app/lib/notification-policy.ts` | Strong status-specific messages from Pass 7; conversation_started message was brief and generic |
| Messaging policy | `app/lib/messaging-policy.ts` | conversation_started notification title/message were generic |
| Application tracker | `app/applications/page.tsx` | Already strong from previous passes; no changes needed this pass |
| Recruiter applicant review | `app/recruiter/auditions/[id]/applicants/page.tsx` | Already strong from previous passes; no changes needed this pass |
| MetricCard | `components/product-ui.tsx` | Detail text used `font-semibold` inconsistently with rest of design system |
| ApplicationMessageButton | `components/application-message-button.tsx` | Error text used `text-red-700` inconsistently with amber error convention |

---

## Messages Inbox Improvements (`app/messages/page.tsx`)

### Talent empty state: passive → active
**Before:** "Recruiter conversations will appear here when casting teams contact you."  
**After:** "Conversations appear here when a recruiter messages you about an application, or when you message a casting team."

The old copy made Talent feel like they could only wait. The new copy makes it clear they can initiate too.

### Conversation card type chip: role-aware + archived state
**Before:**
```
'Applicant conversation' (recruiter)
'Recruiter conversation' (talent)
```
**After:**
```
'Archived' (when conversation.status === 'archived')
'Applicant conversation' (recruiter, active)
'Audition conversation' (talent, active)
```

"Audition conversation" for Talent is clearer than "Recruiter conversation" — it identifies the context (the casting call), not just who sent it. Archived conversations now show an "Archived" chip so the list view is informative even when the ARCHIVED filter is not active.

### Last-message fallback: "Conversation ready" → "No messages yet"
**Before:** `conversation.lastMessageText || 'Conversation ready'`  
**After:** `conversation.lastMessageText || 'No messages yet'`

"Conversation ready" was confusing — it implied something needed to be prepared. "No messages yet" is direct.

### Inbox habits aside: remove "early" qualifier from safety hint
**Before:** "Avoid sharing personal contact details early."  
**After:** "Never share personal contact details in chat."

"Early" implied it eventually becomes acceptable to share contact details. "Never" is the correct policy.

---

## Conversation Detail Page Improvements (`app/messages/[conversationId]/page.tsx`)

### Header eyebrow: role-aware label
**Before:** "Application conversation" (same for all users)  
**After:** "Applicant conversation" (recruiter) / "Audition conversation" (talent)

Talent sees the context they care about (the audition). Recruiters see the context they care about (who applied).

### Compose textarea placeholder: casting-specific
**Before:** `'Write a message'`  
**After:** `'Message about the role, next steps, or self-tape.'`

The previous placeholder was identical to generic messaging apps. The new placeholder frames the compose box as a casting tool and suggests three specific, relevant uses.

### Compose error: red → amber styling
**Before:** `border-red-300 bg-red-50 text-sm text-red-800` (raw `<p>`)  
**After:** `rounded-md border-amber-300 bg-amber-50 text-sm font-bold text-amber-900`

Consistent with the amber error convention used throughout the rest of the app.

### Aside description: clinical → context-setting
**Before:** "This thread exists only because the Talent member applied to this casting call."  
**After:** "This conversation is linked to the casting call application. Keep next steps and decisions here for a clear, shared record."

Old copy was technically accurate but felt like a system warning. New copy explains *why* keeping communication here matters.

### Aside trust reminder: renamed + tightened
**Before:** Title: "Trust reminder" / Copy: "Keep casting details and next steps here so both sides have a clear record. Never request or send payment to audition in chat."  
**After:** Title: "Platform safety" / Copy: "Never share personal contact details or request payment in casting conversations. Keep all communication here."

"Platform safety" is clearer than "Trust reminder" as a section header. The new copy prioritizes the most critical safety rule (no contact details, no payment) and is tighter.

### Return link: role-aware label
**Before:** "View linked application" (same for all users)  
**After:** "View in My Applications" (talent) / "Open applicant review" (recruiter)

The new labels describe the destination in role-specific terms the user already knows, reducing cognitive friction.

---

## Notifications Page Improvements (`app/notifications/page.tsx`)

### Per-category unread counts on tabs
**Before:** Only the ALL tab showed an unread count: `ALL (5 unread)`. Category tabs (Applications, Messages, Auditions, Trust/Account) showed no indication of unread activity.

**After:** Each tab shows its unread count inline:
- ALL tab: `All (5 unread)` (unchanged format)
- Category tabs: `Applications (3)` / `Messages (2)` etc. when there are unread items in that category

This allows users to immediately see which category needs attention without clicking through each tab.

### Error block: red → amber styling
**Before:** `border border-red-300 bg-red-50 text-sm text-red-800` (bare `<div>`)  
**After:** `rounded-md border-amber-300 bg-amber-50 text-sm font-bold text-amber-900`

Consistent with the amber error convention used throughout the app.

### Notification timestamp: `font-semibold` → `font-bold`
**Before:** `text-xs font-semibold text-[#7a878d]`  
**After:** `text-xs font-bold text-[#7a878d]`

Consistent with the design system convention of using `font-bold` throughout.

### Empty states: context-aware by filter tab
**Before:** All filter tabs showed the same empty state copy: "Application updates and recruiter messages will appear here."

**After:** Each tab has its own message:
| Filter | Empty state copy |
|--------|-----------------|
| ALL | "Application updates, recruiter messages, and casting decisions will appear here." |
| APPLICATIONS | "Application status updates — shortlist, callback, final round, and decisions — will appear here." |
| MESSAGES | "Notifications from new recruiter messages and conversation activity will appear here." |
| AUDITIONS | "Updates about auditions you follow or have applied to will appear here." |
| TRUST | "Account and trust notices — verification updates, safety alerts — will appear here." |

### Empty state heading: `'No updates here'` → `'Nothing here yet'`
**Before:** "No updates here" (used for all non-ALL filter tabs)  
**After:** "Nothing here yet" — less dismissive, more accurate when the category simply has no notifications yet.

---

## Notification Policy Improvements (`app/lib/notification-policy.ts`)

No changes made. The notification policy was already upgraded in Pass 7:
- SHORTLISTED, CALLBACK, FINAL_ROUND, REJECTED, SELECTED messages are all casting-specific
- VIEWED message preserved (test assertion on "opened your application")
- All priority levels are correctly set

---

## Messaging Policy Improvements (`app/lib/messaging-policy.ts`)

### `buildConversationNotification`: casting-specific title and message

**conversation_started:**
- Title: "Conversation started" → "Casting conversation started"
- Message: "A conversation was opened for {auditionTitle}." → "A casting conversation was opened for {auditionTitle}. Open it to ask questions or discuss next steps."

**new_message fallback (no preview):**
- "You received a new message." → "You received a new message about a casting call."

These changes do not affect any test assertions (tests only assert on `type`, `actionUrl`, and `recipientId`).

---

## Application Tracker Connection Notes (`app/applications/page.tsx`)

No changes needed. The applications page is already well-connected to messaging:
- `ApplicationMessageButton` shows "Message Recruiter" / "Message Recruiter (new)" with unread awareness
- `nextStepMessages` for SHORTLISTED, CALLBACK, FINAL_ROUND already include "Watch for a message" / "The recruiter may message you"
- `SafetyNotice` already present at page bottom
- `MetricCard` for "Unread threads" already shows message count

---

## Recruiter Applicant Review Connection Notes (`app/recruiter/auditions/[id]/applicants/page.tsx`)

No changes needed. The applicant review aside already includes:
- An `ApplicationMessageButton` with casting-contextual label
- Application status badge
- "Next action" panel (added in Pass 7) giving step-specific recruiter guidance

---

## Supporting Component Improvements

### `components/product-ui.tsx` — MetricCard detail text
`font-semibold` → `font-bold` on the `detail` prop text below MetricCard values. This was a design system inconsistency affecting every `MetricCard` rendered across the app (auditions page, applications page, dashboard).

### `components/application-message-button.tsx` — error text
`text-xs text-red-700` → `text-xs font-bold text-amber-700` for the inline error shown when a conversation cannot be opened.

---

## What Remains for Future Versions

- **Real-time message updates** — conversations do not update without a page reload; polling or WebSocket subscription would enable live replies
- **Conversation archived state visual** — archived conversations are now labelled "Archived" in the type chip, but there is no distinct visual treatment (muted opacity, visual separator) to distinguish them from active conversations
- **In-thread status update display** — when a recruiter updates an application status, the conversation thread does not show a system message; the Talent only sees the updated StatusBadge in the aside
- **Unread notification dot in nav** — the notifications icon in the nav shows a dot when there are unread items, but the messages icon does not yet show a similar unread indicator
- **Notification grouping** — multiple application updates for the same role appear as separate cards; grouping by application would reduce visual noise on active accounts
- **Notification pagination** — the notification list loads all records; a "Load more" or virtual scroll would improve performance on accounts with many notifications

---

## Manual Test Checklist

### Messages inbox (`/messages`)

- [ ] Talent empty state (no conversations): "Conversations appear here when a recruiter messages you about an application, or when you message a casting team."
- [ ] Recruiter empty state (no conversations): "Applicant conversations will appear here when you message Talent about an audition." (unchanged)
- [ ] Card with no messages: last-message preview reads "No messages yet"
- [ ] Card with messages: last-message preview shows actual message text (truncated)
- [ ] Active conversation card type chip — Talent view: reads "Audition conversation"
- [ ] Active conversation card type chip — Recruiter view: reads "Applicant conversation"
- [ ] Archived conversation card type chip: reads "Archived" regardless of userType
- [ ] Inbox habits aside (xl screens): third bullet reads "Never share personal contact details in chat."
- [ ] Unread card: teal border, gold "New" chip in name row — unchanged
- [ ] Search, filter tabs (ALL/UNREAD/ACTIVE/ARCHIVED), and sort all work — unchanged

### Conversation detail page (`/messages/[conversationId]`)

- [ ] Talent view — header eyebrow reads "Audition conversation"
- [ ] Recruiter view — header eyebrow reads "Applicant conversation"
- [ ] Compose textarea placeholder reads "Message about the role, next steps, or self-tape."
- [ ] Read-only compose placeholder reads "This conversation is read-only." — unchanged
- [ ] Compose error (if triggered): amber border/background, no red styling
- [ ] Aside section title reads "Platform safety" (not "Trust reminder")
- [ ] Aside description reads "This conversation is linked to the casting call application. Keep next steps and decisions here for a clear, shared record."
- [ ] Talent view — return link reads "View in My Applications"
- [ ] Recruiter view — return link reads "Open applicant review"
- [ ] Recruiter return link goes to `/recruiter/auditions/{auditionId}/applicants` — unchanged
- [ ] Talent return link goes to `/applications` — unchanged
- [ ] Application status badge in aside still visible — unchanged
- [ ] Message thread, report button, read-only banner, character count — all unchanged

### Notifications (`/notifications`)

- [ ] ALL tab shows `(N unread)` count when N > 0 — unchanged format
- [ ] Applications tab shows `(N)` count when there are unread application notifications
- [ ] Messages tab shows `(N)` count when there are unread message notifications
- [ ] Tabs without unread items show no count — no `(0)` displayed
- [ ] Error banner (if triggered): amber border/background, no red styling
- [ ] Notification timestamp: `font-bold` (not `font-semibold`)
- [ ] Empty state on ALL tab: "Application updates, recruiter messages, and casting decisions will appear here."
- [ ] Empty state on APPLICATIONS tab: "Application status updates — shortlist, callback, final round, and decisions — will appear here."
- [ ] Empty state on MESSAGES tab: "Notifications from new recruiter messages and conversation activity will appear here."
- [ ] Empty state heading for category tabs: "Nothing here yet" (not "No updates here")
- [ ] Empty state on ALL tab heading: "You are all caught up" — unchanged
- [ ] Category icons, priority badge, action labels, mark-all-read button — all unchanged

### MetricCard detail text (all pages using MetricCard)

- [ ] `/auditions` — "Matching this search" detail renders in `font-bold`
- [ ] `/applications` — "Submitted or under review", "Callback and final-round momentum" details render in `font-bold`
- [ ] `/dashboard` — recruiter stats detail text renders in `font-bold`

---

## Firebase Deploy Notes

No Firestore rules, indexes, or Cloud Functions were changed. Firebase deploy is not required for this pass.

---

## Vercel Deploy Notes

A Vercel redeploy is required for the following changed pages and components:

- `app/messages/page.tsx`
- `app/messages/[conversationId]/page.tsx`
- `app/notifications/page.tsx`
- `app/lib/messaging-policy.ts` (consumed by `/api/messages` server route)
- `components/product-ui.tsx` (used across auditions, applications, dashboard, recruiter pages)
- `components/application-message-button.tsx` (used on applications page)

Push `main` branch to GitHub and Vercel will deploy automatically.

---

## Files Changed

| File | Type |
|------|------|
| `app/messages/page.tsx` | Edited — Talent empty state, type chip (role-aware + archived), last-message fallback, safety habits copy |
| `app/messages/[conversationId]/page.tsx` | Edited — header eyebrow role-aware, compose placeholder, compose error amber, aside description, aside trust title, return link role-aware |
| `app/notifications/page.tsx` | Edited — per-category unread counts on tabs, error amber styling, empty states context-aware by filter, timestamp font-bold, empty heading improved |
| `app/lib/messaging-policy.ts` | Edited — buildConversationNotification title and messages improved |
| `components/product-ui.tsx` | Edited — MetricCard detail font-semibold → font-bold |
| `components/application-message-button.tsx` | Edited — error text amber styling |
| `MESSAGING_NOTIFICATIONS_EXPERIENCE_UPGRADE_REPORT.md` | Created (this file) |
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
