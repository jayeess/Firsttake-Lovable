# Launch Readiness Command Center

**Pass 22 — Completed 2026-06-29**

## Objective

Upgrade the existing `/admin/beta-readiness` page into a production-grade Launch Readiness Command Center with a policy-based scoring model, real marketplace health signals from Firestore, a live safety queue, and a full blocker panel — replacing the static score count with a 0–100% readiness band system.

---

## Scope

| Category | Files |
|---|---|
| New policy library | `app/lib/launch-readiness-policy.ts` |
| API extension | `app/api/admin/data/route.ts` (new `launchReadiness` view) |
| Admin page upgrade | `app/admin/beta-readiness/page.tsx` |
| Admin nav | `components/admin-shell.tsx` |
| Admin dashboard | `app/admin/page.tsx` |
| Tests | `tests/launch-readiness-policy.test.mts` |
| Docs | `CHANGELOG.md`, `TESTING.md`, `PRODUCT_STATUS_AND_ROADMAP.md`, `FULL_APP_UX_POLISH_REPORT.md` |

---

## Architecture

### `app/lib/launch-readiness-policy.ts`

Pure TypeScript policy module with no runtime dependencies. Exports:

| Export | Purpose |
|---|---|
| `LaunchReadinessBand` | `'blocked' \| 'needs_attention' \| 'almost_ready' \| 'ready'` |
| `LaunchReadinessSeverity` | `'critical' \| 'high' \| 'medium' \| 'info'` |
| `LaunchReadinessItem` | Per-signal result (`key`, `label`, `status`, `severity`, optional `actionHref`, `detail`) |
| `LaunchReadinessInput` | Input shape: `checks`, `stats`, `reports` |
| `LaunchReadinessSummary` | Output: `score`, `band`, `items[]`, `blockers[]` |
| `scoreLaunchReadiness(data)` | 0–100 weighted score across 10 signals |
| `getReadinessBand(score, criticalBlockers)` | Maps score + blocker count to a band |
| `getLaunchItems(data)` | Per-signal status array |
| `getLaunchBlockers(data)` | Filtered list of non-OK items |
| `getLaunchReadinessSummary(data)` | Full summary object |

### Scoring model

Total = 100 points. Weighted by operational impact:

| Signal | Points | Critical blocker |
|---|---|---|
| Firebase project connected | 10 | Yes |
| Firestore reachable | 5 | Yes |
| Admin SDK configured | 10 | Yes |
| Firebase web env configured | 10 | Yes |
| Admin user exists | 10 | Yes |
| Approved recruiter on platform | 15 | No (high) |
| Active audition posted | 15 | No (high) |
| Platform has users | 5 | No (medium) |
| Email provider configured | 10 | No (medium) |
| No urgent open reports | 10 | No (high) |

### Band logic

| Condition | Band |
|---|---|
| Any critical blocker (score overridden) | `blocked` |
| Score < 50, no critical blockers | `needs_attention` |
| 50 ≤ score < 80, no critical blockers | `almost_ready` |
| Score ≥ 80, no critical blockers | `ready` |

---

### `app/api/admin/data/route.ts` — `launchReadiness` view

Single parallel Firestore batch (7 queries):
- Admin users check
- All users (for stats breakdown)
- All recruiter verifications (for pending/approved counts)
- All talent verifications (for pending count)
- All auditions (for active/self-tape counts)
- All applications collectionGroup (for total count)
- Open/under_review reports (for open/urgent safety counts)

Returns `{ checks, stats, reports, env }` — the exact shape consumed by `getLaunchReadinessSummary`.

---

### `app/admin/beta-readiness/page.tsx` — Command Center

Replaces the old static checklist page with:

1. **Band & score** — 0–100% progress bar, `AdminStatusBadge` band label, band description
2. **Blockers panel** — amber panel listing all non-OK items with colored severity dots and action links (only shown when blockers exist)
3. **Env warnings** — amber warning if any Firebase env vars are missing (existing logic preserved)
4. **Marketplace health** — 3 stat cards: Recruiter pipeline (approved, pending, total), Talent (accounts, pending trust checks, total users), Casting supply (active auditions, total applications, self-tape requests)
5. **Safety queue** — 3 stat cards: Open reports, Urgent reports, Suspended accounts — all linking to their admin pages
6. **Infrastructure checks** — grid of infra + feature flag status cards
7. **Launch review areas** — manual checklist (preserved from previous page)
8. **Admin operations guide** — 8 workflow descriptions (preserved)
9. **Manual launch control** — 6 grouped manual checklist items (preserved)
10. **Production commands** — CLI pre block (preserved)

---

## Changes Delivered

### `app/lib/launch-readiness-policy.ts` (new)

Complete policy library — 10-signal scoring, band mapping, blocker extraction, and summary helper.

### `app/api/admin/data/route.ts`

Added `launchReadiness` view case (lines inserted before the default overview case). Uses the same Admin SDK pattern as existing views with a 7-way `Promise.all` batch.

### `app/admin/beta-readiness/page.tsx`

Full rewrite. Now fetches `'launchReadiness'` view. `getLaunchReadinessSummary` called via `useMemo` on data load. Two new helper sub-components: `StatRow` (inline stat with optional link) and `StatCard` (standalone stat card with value and badge).

### `components/admin-shell.tsx`

One-line change: `'Beta readiness'` → `'Launch readiness'` in the Overview nav group.

### `app/admin/page.tsx`

Updated "Beta control center" section eyebrow → `"Launch operations"`, title → `"Launch readiness"`, description updated. "Beta readiness" link label → `"Launch readiness"` with updated body copy.

---

## Tests

### `tests/launch-readiness-policy.test.mts` (new — 17 tests)

| Test group | Cases |
|---|---|
| `getReadinessBand` | Ready at 80/100, almost_ready at 50/79, needs_attention at 0/49, blocked with any critical blocker |
| `scoreLaunchReadiness` | 100 for allClear, 0 for hardBlocked, 55 for infra-only partial state |
| `getLaunchBlockers` | Returns non-empty for hardBlocked, empty for allClear, blocked status for critical failures, warning status for non-critical |
| `getLaunchReadinessSummary` | Blocked band + 0 score for hardBlocked, ready band + 100 score + empty blockers for allClear |
| Edge cases | Urgent reports trigger blocker, infra-only state → almost_ready, items array completeness, actionHref forwarding |

---

## Verification

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm test` | 100 / 100 pass (17 new) |
| `npm run build` | 55 routes, TypeScript clean, no errors |
| `git diff --check` | CRLF line-ending notices only (Windows, expected) |

---

## Security constraints respected

- No payment, subscription, AI, calendar scheduling, video calls, direct or self-tape video upload added
- No fake data, no test users, no celebrity names, no copyrighted names
- Firebase/Auth/Admin security unchanged
- No `.env`, service account, or `node_modules` files touched
- No automatic commit
