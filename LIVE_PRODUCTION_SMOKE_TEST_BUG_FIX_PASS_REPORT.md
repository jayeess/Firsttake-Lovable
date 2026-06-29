# Live Production Smoke Test & Bug Fix Pass

**Pass 23 — Completed 2026-06-29**

## Objective

Perform a launch-blocker smoke test across every major flow in the app. Inspect 50+ files
across public/auth, talent, recruiter, admin, API routes, and security rules. Fix any real
issues found. Confirm lint, tests, and build pass cleanly.

---

## Inspection Scope

| Flow | Files inspected |
|---|---|
| Public / auth | `app/page.tsx`, `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/auth/email-verified/page.tsx`, `app/help/page.tsx`, `app/contact/page.tsx`, `app/safety/page.tsx`, `app/community-guidelines/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx` |
| Talent | `app/dashboard/page.tsx`, `app/talent/profile/page.tsx`, `app/auditions/page.tsx`, `app/auditions/[id]/page.tsx`, `app/applications/page.tsx`, `app/messages/page.tsx`, `app/messages/[conversationId]/page.tsx`, `app/notifications/page.tsx` |
| Recruiter | `app/recruiter/profile/page.tsx`, `app/recruiter/verification/page.tsx`, `app/recruiter/auditions/page.tsx`, `app/recruiter/auditions/new/page.tsx`, `app/recruiter/auditions/[id]/applicants/page.tsx` |
| Admin | `app/admin/verifications/page.tsx`, `app/admin/users/page.tsx`, `app/admin/talents/page.tsx`, `app/admin/reports/page.tsx`, `app/admin/messages/page.tsx`, `app/admin/audit-logs/page.tsx`, `app/admin/beta-feedback/page.tsx`, `app/admin/beta-readiness/page.tsx` |
| APIs | `app/api/admin/action/route.ts`, `app/api/admin/data/route.ts`, `app/api/applications/route.ts`, `app/api/applications/self-tape/route.ts`, `app/api/auditions/published/route.ts`, `app/api/auditions/save/route.ts`, `app/api/messages/conversations/route.ts`, `app/api/messages/conversations/[id]/route.ts`, `app/api/messages/read/route.ts`, `app/api/messages/send/route.ts`, `app/api/notifications/route.ts`, `app/api/reports/create/route.ts`, `app/api/recruiter/verification/route.ts`, `app/api/talent/public-profile/route.ts`, `app/api/talent/verification/route.ts` |
| Services / lib | `app/lib/firestore-service.ts`, `app/lib/types.ts`, `app/lib/messaging-client.ts`, `app/lib/messaging-server.ts`, `app/lib/messaging-policy.ts` |
| Security rules | `firestore.rules`, `storage.rules` |
| Components | `components/talent-media-manager.tsx`, `components/admin-shell.tsx` |

---

## Findings

### Verdict: No launch-blocker bugs found

Every file inspected passed the smoke test. The table below records each area reviewed and its
result.

| Area | Result | Notes |
|---|---|---|
| Public pages (landing, help, contact, safety, legal) | PASS | All links correct; all beta notices present |
| Auth flow (login, signup, email-verified) | PASS | Role routing correct; `emailVerified` guard works; admin claims check is `token.claims.admin === true` |
| Dashboard (talent + recruiter) | PASS | `getApplicationNextStep`, `getSelfTapeStatus`, `calculateTalentProfileCompleteness` all used correctly |
| Talent profile page | PASS | Dev presets use no celebrity names; `profileCompletenessScore` written on save |
| Auditions discovery | PASS | `ACTIVE` + `VISIBLE` filter; `addRecruiterTrust` enrichment correct |
| Audition detail | PASS | Save, apply, and self-tape flows use correct API endpoints; ownership validated server-side |
| Applications tracker | PASS | Collection-group query with Firestore-level fallback; `MAYBE` correctly included in ACTIVE tab |
| Messaging (inbox + thread) | PASS | Participant guard, status guard (active only), suspend check, read receipt batch correct |
| Notifications page | PASS | Fetches via `getNotifications()` → `/api/notifications`; mark-read and mark-all-read dispatch `notifications:changed` event |
| Recruiter profile | PASS | `isVerified` preserved on update; preset names are generic |
| Recruiter verification | PASS | Evidence sanitized; field lengths capped; status guard (`not_submitted` / `rejected` only) |
| Recruiter auditions list | PASS | Hero links to `/recruiter/auditions/new` and `/messages`; correct |
| New casting brief | PASS | Self-tape section uses external links only; `selfTapeSubmissionTypes: ['link']` enforced |
| Applicants review | PASS | Ownership check (`audition.recruiterId !== actor.uid`); `MAYBE` in pipeline tabs; quick-status actions consistent with recruiter PATCH route |
| Admin verifications | PASS | Approve / reject / suspend / restore actions all guarded by `AdminActionButton` which calls `/api/admin/action` |
| Admin users, talents, reports, messages, audit-logs, beta-feedback | PASS | All fetch via `fetchAdminData`; retry patterns present; empty/error states handled |
| Launch Readiness Command Center | PASS | Fetches `launchReadiness` view; `getLaunchReadinessSummary` called via `useMemo`; band + score + blockers all render correctly |
| Admin action API | PASS | 20+ actions guarded; reason required for destructive actions; audit log written |
| Admin data API — all views | PASS | `launchReadiness` view returns `checks`, `stats`, `reports`, `env`; consistent with `LaunchReadinessInput` type |
| Applications API (POST + PATCH) | PASS | Talent guard → suspended check → deadline check → policy validate; PATCH requires recruiter ownership + approval |
| Self-tape API (POST + DELETE + PATCH) | PASS | Deadline guard; link-type check; recruiter ownership for PATCH; correct notification targets |
| Auditions save API | PASS | Talent guard; `ACTIVE` + not `REMOVED` check; correct savedAuditions path |
| Messages APIs (conversations, messages, read) | PASS | Participant guard on all; `getConversationId` deterministic; batch read receipt correct |
| Notifications API | PASS | Ownership check on mark-read; `unreadCount` computed correctly after boolean normalization |
| Reports create API | PASS | targetType and reasonCode whitelists; deduplication; recipientId validation |
| Recruiter verification API | PASS | Field list sanitized; evidence validated against storage path pattern; Admin SDK write |
| Talent verification API | PASS | `canSubmitTalentVerification` check; transaction writes both `talentVerifications` and `talentProfiles` |
| Public profile API | PASS | Slug uniqueness check in transaction; old slug deleted on rename; `disable` action removes `publicTalentProfiles` doc |
| Firestore rules | PASS | Notification update locked to `read`/`readAt` only; conversation update locked to `unreadBy`/`updatedAt`; application update locked to recruiter-side fields only; `MAYBE` included in allowed update statuses |
| Storage rules | PASS | Profile and portfolio images: 5 MB cap, JPEG/PNG/WebP only, `visibility: recruiters`; recruiter evidence: 10 MB cap, PDF allowed, `uploadKind` validated; Admin SDK used for moderation bypasses |
| `firestore-service.ts` | PASS | `saveTalentMedia` uses transaction to track count; `removeTalentMedia` uses transaction to decrement; `getTalentApplications` has collectionGroup query with full fallback |
| `talent-media-manager.tsx` | PASS | Calls Storage upload then Firestore via `saveTalentMedia`; media event POST is fire-and-forget (`.catch(() => undefined)`) |

---

## Bugs Fixed

**None.** No launch-blocker or noteworthy bugs were identified during this pass. The codebase
is coherent across all inspected flows.

---

## Security Constraints Confirmed

| Constraint | Status |
|---|---|
| No payment / subscription | ✓ |
| No AI | ✓ |
| No calendar scheduling | ✓ |
| No video calls | ✓ |
| No direct video upload | ✓ |
| No self-tape video upload (external links only) | ✓ |
| No fake data / seed users / celebrity names / copyrighted names | ✓ |
| Firebase / Auth / Admin security unchanged | ✓ |
| `.env`, service-account, `node_modules` not touched | ✓ |

---

## Verification

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm test` | 100 / 100 pass |
| `npm run build` | 55 routes, TypeScript clean, compiled successfully |
| `git diff --check` | No whitespace issues |

---

## Conclusion

The live production smoke test found zero launch-blocker bugs. All critical flows — public
pages, auth, talent profile, audition discovery, application pipeline, messaging, notifications,
recruiter posting, admin moderation, verification queues, and the launch readiness command center
— are coherent, correctly role-gated, and properly protected at both the API and Firestore rules
level. The platform is ready for a controlled launch.
