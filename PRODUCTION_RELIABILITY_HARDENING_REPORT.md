# Production Reliability and Safe Error-State Hardening Report

**Date:** June 23, 2026
**Pass:** Production Reliability and Safe Error-State Hardening
**Status:** Complete — lint clean, 70/70 tests passing, production build passing

---

## Objective

Make the production app more resilient, calm, and safe during real private beta
usage. The focus is on:

- Adding proper error boundaries so unhandled errors never expose raw technical
  details to real users
- Fixing a raw `error.message` passthrough in the shared error utility that
  could surface Firebase/Firestore internals
- Providing consistent loading feedback using the shared `LoadingState`
  component instead of bare inline `<p>` tags
- Adding a secondary CTA to `ErrorState` so users have a recovery path even
  when retry is not available
- Adding a contact support link to the suspended account state so affected
  users have a way to reach out

This pass did not change APIs, Firestore rules, authentication logic, or any
feature behaviour. No new Firebase, Storage, payment, or AI features were added.

---

## Files Changed

### 1. `app/error.tsx` (CREATED)

**Problem:** There was no route-level error boundary. If any route threw during
render — a bad Firestore response, a component crash, or an unexpected null
reference — Next.js would surface its own generic error screen with no brand
context and no recovery path.

**Fix:** Added `app/error.tsx` as a branded route-level error boundary
(`'use client'`, receives `reset` callback). Shows a calm "Something went
wrong." page in the Nata Connect brand design with two CTAs:
- "Try again" — calls `reset()` to re-render the failed route
- "Go to workspace" — Link to `/dashboard` for users who want a clean exit

The `error.digest` and `error.message` properties are never displayed to the
user. The page matches the same header/layout style as `app/not-found.tsx` for
visual consistency.

---

### 2. `app/global-error.tsx` (CREATED)

**Problem:** There was no root-level error boundary. If the root layout itself
threw — a catastrophic failure in the auth context, app shell, or layout
wrapper — users would see a blank screen or the browser's own network error
page.

**Fix:** Added `app/global-error.tsx` as the root error boundary. Requirements:
- Must be `'use client'`
- Must render its own `<html>` and `<body>` tags (since the root layout is
  bypassed when this fires)
- Tailwind CSS may not be available (CSS bundle could fail alongside the
  layout), so inline styles are used exclusively

Design: midnight navy background (`#07111f`), white heading, muted body copy,
teal "Reload page" button (`#008ca6`). No logo image (asset server may be
affected). The text "Nata Connect" identifies the brand as plain uppercase copy.

---

### 3. `app/loading.tsx` (CREATED)

**Problem:** There was no `app/loading.tsx`. Next.js App Router uses this file
as the Suspense boundary fallback for page transitions. Without it, route
transitions showed no feedback — the old page content would remain visible until
the new route finished loading, making the app feel unresponsive.

**Fix:** Added `app/loading.tsx` as a Server Component with a branded loading
indicator. Matches the visual pattern of `LoadingState` from
`components/async-state.tsx` — teal pulse dot and muted "Loading..." text —
wrapped in the standard page max-width padding so it aligns with page content.

---

### 4. `app/lib/error-utils.ts`

**Problem:** `getErrorMessage()` had two raw message passthroughs:

```typescript
// Line 30 — passes raw Firebase/Firestore/JS error.message to the caller
return error.message;

// Lines 35–37 — same issue for non-Error objects with a message property
const message = (error as { message?: unknown }).message;
if (typeof message === 'string' && message) {
  return message;  // could surface internal server details
}
```

Any caller using this utility for a non-auth error (e.g. a Firestore read
failure, a network timeout, an SDK internal error) would receive the raw error
message and likely show it in the UI. Firebase/Firestore error messages often
contain internal collection paths, document IDs, or "permission-denied" phrasing
that is confusing or alarming to end users.

**Fix:** Both raw passthrough returns now return `fallback` instead:

```typescript
return fallback;  // was: return error.message
```
```typescript
return fallback;  // was: return message
```

All callers already provide a meaningful fallback string. The fix has no visible
effect for the 7 recognised auth error codes (those are still matched first) and
ensures that any unrecognised error shows a calm, product-safe message rather
than a technical string.

**Audit of existing callers:** All current callers of `getErrorMessage()` pass
safe hardcoded fallback strings and display their error via state variables
(which the UI presents in hardcoded `ErrorState` messages). The fix adds
defense-in-depth at the utility level.

---

### 5. `components/async-state.tsx`

**Problem:** `ErrorState` had one action option: "Try again" (calls `onRetry`).
If the caller did not provide `onRetry` (e.g. an unrecoverable data error where
retrying is not meaningful), the component rendered with no actions at all —
users had no recovery path.

**Fix:** Added optional `secondaryHref` and `secondaryLabel` props to
`ErrorState`. When provided, a secondary Link button appears alongside (or
instead of) "Try again". The buttons sit in a `flex-wrap gap-3` row so they
stack gracefully on mobile.

Example usage (existing callers unaffected — all new props are optional):
```tsx
<ErrorState
  message="We could not load your applications."
  onRetry={refetch}
  secondaryHref="/dashboard"
  secondaryLabel="Go to workspace"
/>
```

---

### 6. `components/app-shell.tsx`

**Problem:** The suspended account state showed only a "Log out" button. A user
whose account was incorrectly suspended, or who wanted to understand why their
account was restricted, had no way to reach support from this screen. They would
have to log out, find the `/contact` or `/help` page, and navigate there
unauthenticated.

**Fix:** Added a "Contact support" link to `/help` below the "Log out" button
in the suspended account section. The link uses the brand teal underline
treatment so it is clearly tappable on mobile without being a large button.

---

### 7. `app/notifications/page.tsx`

**Problem:** The initial loading state used a bare inline `<p>` tag:
```tsx
<p className="text-sm font-semibold text-[#657176]">Loading activity...</p>
```
This was visually inconsistent with every other loading state in the app, which
all use the shared `LoadingState` component with its teal pulse dot and
bordered surface.

**Fix:** Added `import { LoadingState } from '@/components/async-state'` and
replaced the bare `<p>` with `<LoadingState label="Loading activity..." />`.

---

### 8. `app/applications/page.tsx`

**Problem:** Same as notifications — a bare inline `<p>` tag for the initial
loading state:
```tsx
<p className="text-sm font-semibold text-[#657176]">Loading your applications...</p>
```

**Fix:** Added `import { LoadingState } from '@/components/async-state'` and
replaced with `<LoadingState label="Loading your applications..." />`.

---

## What Was Not Changed

- **Firestore rules**: No security rules changed.
- **API routes**: No server-side data routes changed.
- **Authentication logic**: No auth flows or admin claim checks changed.
- **Feature behaviour**: No user-facing features added, removed, or changed.
- **Existing error display**: Pages that already used hardcoded safe error
  messages (messages, conversation, dashboard, auditions detail, admin pages)
  were left as-is — they were already safe.
- **Payment, subscriptions, Firebase Storage, AI**: None added.

---

## Before / After Summary

| Area | Before | After |
|------|--------|-------|
| Route error boundary | None — raw Next.js error screen | `app/error.tsx` — branded, calm, no technical details |
| Root error boundary | None — blank/browser error screen | `app/global-error.tsx` — inline-styled, self-contained |
| Page transitions | No loading feedback | `app/loading.tsx` — branded pulse dot |
| `getErrorMessage()` non-auth errors | Returns raw `error.message` | Returns `fallback` string |
| `ErrorState` actions | "Try again" only (or nothing) | "Try again" + optional secondary Link |
| Suspended account state | "Log out" button only | "Log out" + "Contact support" link to `/help` |
| Notifications loading state | Bare `<p>` tag | Shared `<LoadingState>` component |
| Applications loading state | Bare `<p>` tag | Shared `<LoadingState>` component |

---

## Manual Checks Recommended

After deploying:

- [ ] Trigger a route error (temporarily throw in a page) — branded error page
  with "Try again" and "Go to workspace" should appear, no raw error text.
- [ ] Check the notifications page — initial load shows the teal pulse dot
  loading indicator, not plain grey text.
- [ ] Check the applications page — same branded loading indicator.
- [ ] Suspend a test account — suspended screen shows "Contact support" link
  below the "Log out" button.
- [ ] Confirm `ErrorState` with `secondaryHref` shows the secondary button
  alongside "Try again".

---

## Test Results

```
npm run lint   → Clean
npm test       → 70 / 70 pass
npm run build  → Success, 55 routes, 0 errors
```

---

## Deployment Notes

No Firestore rules, indexes, or schema changes. Vercel redeploy required for
UI changes. The new `app/error.tsx`, `app/global-error.tsx`, and
`app/loading.tsx` files are automatically detected by Next.js App Router
conventions — no additional configuration required.
