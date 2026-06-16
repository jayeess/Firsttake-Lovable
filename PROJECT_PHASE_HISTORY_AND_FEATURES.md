# Nata Connect / FirstTake Project Phase History and Features

## Executive Summary

Nata Connect / FirstTake is a centralized digital talent discovery and casting platform for actors, models, dancers, voice artists, recruiters, casting teams, and production teams. The product helps talent create trusted professional profiles, discover relevant auditions, apply with portfolio context, and communicate with recruiters. It helps recruiters publish casting calls, review applicants, manage pipelines, and connect with verified talent.

The initial market focus is Telugu and English entertainment markets, with a product foundation that can expand into broader regional, national, and international casting workflows. The platform solves a practical industry problem: casting opportunities, talent profiles, trust signals, and communication are often scattered across social media, messages, spreadsheets, and informal networks. Nata Connect brings these workflows into one secured, structured, auditable system.

## Current Production Status

| Area | Status |
| --- | --- |
| Production URL | `https://firsttake-lovable.vercel.app` |
| Hosting | Vercel |
| Firebase project | `nata-connect-prod` |
| GitHub repo | `jayeess/Firsttake-Lovable` |
| Firebase Auth | Connected |
| Firestore | Connected |
| Firebase Storage | Connected |
| Admin dashboard | Working |
| Public Firebase env loading | Production hardening fix completed |
| Firebase Admin Vercel bundling | Production hardening fix completed |
| Firebase Admin dependency compatibility | Production hardening fix completed |
| Current status | Working production beta foundation |

The latest production application is deployed on Vercel and connected to the production Firebase project. Public client Firebase configuration now loads correctly in production, and server-side Firebase Admin compatibility has been hardened for Vercel server functions.

## Phase-by-Phase Development History

### Phase 0 - MVP Stabilization

Phase 0 focused on making the first casting workflow reliable enough to test with real user behavior.

Completed:

| Area | Work Completed |
| --- | --- |
| Applications | Talent can submit and withdraw applications. |
| Duplicate protection | Duplicate applications are blocked. |
| Audition validity | Expired, inactive, draft, and deleted auditions are protected from application submission. |
| Applicant counts | Recruiter applicant counts were made more accurate. |
| Firestore rules | Rules were hardened around ownership, status, and write permissions. |
| Collection-group loading | Application loading was improved for talent and recruiter views. |
| Sessions | Tab-scoped sessions were added so different accounts can be tested in different browser tabs/windows. |
| Verification | Policy tests and build checks were added to catch regressions. |

Outcome: the MVP stopped behaving like a loose prototype and became a safer base for recruiter and talent workflows.

### Phase 1 - Recruiter Verification and Admin Trust Layer

Phase 1 introduced platform trust, admin control, and recruiter approval workflows.

Completed:

| Area | Work Completed |
| --- | --- |
| Admin identity | Firebase Admin custom claims were added for administrator access. |
| Admin dashboard | A secured admin dashboard was created. |
| Recruiter verification | Recruiters can submit verification details for review. |
| Admin review | Admins can approve, reject, suspend, and restore recruiters. |
| Verified badges | Approved recruiters receive visible trust indicators. |
| Publishing control | Only approved active recruiters can publish auditions. |
| Audit logs | Admin actions are recorded for traceability. |
| Admin APIs | Secure server-side APIs were added using Firebase Admin SDK. |

Outcome: recruiters became accountable entities, and publishing auditions became a trust-controlled action.

### Phase 1.5 / 1.6 - QA, CI, Emulator, and E2E Testing

This phase improved confidence in the app before expanding the feature set.

Completed:

| Area | Work Completed |
| --- | --- |
| Playwright | End-to-end testing setup was added. |
| CI readiness | GitHub Actions and CI-friendly checks were prepared. |
| UI states | Loading, error, and empty states were improved. |
| Firestore emulator | Rules tests were added using Firebase emulators. |
| Route protection | Signed-out route protection tests were added. |
| Java emulator notes | Local emulator requirements and Java setup notes were documented. |
| Dev server stability | Stale dev server issues were identified and solved during testing. |

Outcome: the project gained a repeatable testing baseline across unit, build, rules, and browser flows.

### Firebase Migration - `nata-connect-prod`

The project was migrated to the production Firebase project.

Completed:

| Area | Work Completed |
| --- | --- |
| Firebase project | Production project `nata-connect-prod` was connected. |
| Auth | Firebase Authentication was enabled and configured. |
| Firestore | Firestore was enabled for production data. |
| Storage | Firebase Storage was enabled for media workflows. |
| Admin SDK | Server-side Admin SDK environment setup was added. |
| Admin claim | Admin custom claim setup script and workflow were added. |
| Rules/indexes | Firestore rules and indexes were deployed. |
| Storage rules | Storage rules were deployed for secure media access. |

Outcome: the app moved from development setup toward a production-ready Firebase backend.

### Phase 1.7 - Talent Trust Layer

Phase 1.7 added trust indicators and verification workflows for talent profiles.

Completed:

| Area | Work Completed |
| --- | --- |
| Verification status | Talent profiles gained `not_submitted`, `pending`, `verified`, `rejected`, and `suspended` verification states. |
| Completeness | Profile completeness score and checklist were added. |
| Admin queue | `/admin/talents` was created for talent verification review. |
| Admin actions | Admins can approve, reject, suspend, and restore talent profiles. |
| Verified badge | Verified talent badges appear in trusted contexts. |
| Audit logs | Talent verification actions are recorded. |
| Notifications | Talent verification events can notify users. |
| Security rules | Rules prevent talent from self-verifying while allowing safe submission updates. |

Outcome: talent profiles now communicate quality and trust without blocking basic platform usage.

### Phase 2A - Notifications and Activity Center

Phase 2A added user-facing notifications and an activity center.

Completed:

| Area | Work Completed |
| --- | --- |
| Schema | `notifications/{notificationId}` schema was added. |
| Notification bell | Header unread count and notification access were added. |
| Activity center | `/notifications` page was created. |
| Read states | Mark read and mark all read actions were added. |
| Notification events | Applications, verification updates, moderation actions, suspension, and restoration events can create notifications. |
| Security | Notification access is scoped to the notification owner. |
| Indexes | Firestore indexes were added for notification queries. |

Outcome: users can see platform activity without relying only on page refreshes or manual checking.

### Phase 2B - Talent Media Portfolio Uploads

Phase 2B added portfolio media as a core talent profile capability.

Completed:

| Area | Work Completed |
| --- | --- |
| Profile photo | Talent can upload a profile photo. |
| Portfolio images | Talent can upload portfolio images. |
| Showreels | External showreel links are supported. |
| Validation | Upload validation covers file type, ownership, and size limits. |
| Featured media | Talent can mark selected media as featured. |
| Visibility controls | Media supports private, recruiter-facing, and public visibility patterns. |
| Applicant preview | Recruiters can review applicant media in the pipeline. |
| Admin moderation | Admin media moderation controls were added. |
| Storage paths | User-scoped Storage paths were defined. |
| Storage rules | Storage rules protect owner-only uploads and controlled visibility. |

Outcome: applications and profiles gained stronger visual proof of talent quality.

### Phase 2C - Recruiter Applicant Pipeline Upgrade

Phase 2C upgraded applicant review into a structured casting pipeline.

Completed:

| Area | Work Completed |
| --- | --- |
| Workflow | Applicant statuses include viewed, under review, shortlisted, maybe, rejected, selected, and withdrawn. |
| Recruiter notes | Recruiters can add internal notes. |
| Tags | Applicant tagging was added. |
| Ratings | Recruiters can rate applicants. |
| Filters | Applicant filters and sorting were added. |
| Compatibility | Legacy application status behavior remains supported. |
| Audit logs | Pipeline actions can be audited. |
| Notifications | Talent can be notified about relevant casting decisions without exposing internal notes. |
| Rules | Firestore rules protect status transitions and private recruiter fields. |

Outcome: recruiters can manage applicants professionally instead of treating every application as a flat list.

### Phase 2D - Search, Filters, and Discovery

Phase 2D improved audition discovery for talent and applicant discovery for recruiters.

Completed:

| Area | Work Completed |
| --- | --- |
| Search | Audition search was added. |
| Filters | Filters include category, experience, language, project type, compensation, work mode, recruiter verification, recency, and deadline. |
| Sorting | Sorting includes newest, deadline, relevance, recently updated, and recommended. |
| Recommendations | Rule-based recommendations use profile and audition signals. |
| Saved auditions | Talent can save auditions. |
| Recruiter filters | Recruiters gained stronger applicant filters. |
| Saved schema | Saved auditions use `users/{uid}/savedAuditions/{auditionId}`. |

Outcome: users can navigate opportunities more efficiently and recruiters can scan stronger applicant sets.

### Phase 2E - Public / Shareable Talent Profiles

Phase 2E introduced public-facing talent profile pages.

Completed:

| Area | Work Completed |
| --- | --- |
| Public route | `/t/[slug]` was added. |
| Slugs | Public profile slugs were introduced. |
| Public schema | `publicTalentProfiles/{slug}` stores sanitized public profile data. |
| Privacy controls | Talent controls whether public profile visibility is enabled. |
| Portfolio preview | Public active media can be shown. |
| Media safety | Only public active media appears publicly. |
| Verified badge | Verified talent badge appears on public profiles. |
| Share action | Share and copy link actions were added. |
| SEO | Public profile metadata was added. |
| Admin controls | Admins can disable public profiles. |
| Notifications | Public profile related actions can notify users. |

Outcome: talent can share a professional Nata Connect profile outside the app while privacy boundaries remain in place.

### Phase 3A - Messaging / Recruiter-Talent Communication

Phase 3A added secure communication between recruiters and talent.

Completed:

| Area | Work Completed |
| --- | --- |
| Conversations | Conversations are linked to applications. |
| Inbox | `/messages` page was added. |
| Conversation detail | `/messages/[conversationId]` page was added. |
| Schema | Conversation and message schemas were created. |
| APIs | Message APIs were added for send/read/conversation access. |
| Entry points | Recruiter and Talent messaging buttons were added. |
| Unread indicators | Message unread states were added. |
| Contact safety | Contact-detail blocking was added to reduce off-platform unsafe sharing. |
| Notifications | Message notifications were added. |
| Moderation | Admin message moderation controls were added. |
| Security | Firestore rules keep conversations participant-only. |

Outcome: recruiter-talent communication became structured, safer, and tied to real applications.

### Phase 3B - Reports, Abuse Handling, and Trust Moderation

Phase 3B added platform safety and abuse reporting.

Completed:

| Area | Work Completed |
| --- | --- |
| Report schema | `reports/{reportId}` was added. |
| Event schema | `reports/{reportId}/events/{eventId}` was added. |
| Report API | `POST /api/reports/create` was added. |
| Report modal | Users can report problematic content or behavior. |
| Report targets | Reports support auditions, public profiles/media, messages, conversations, recruiters, and talents. |
| Duplicate prevention | Recent duplicate reports are reduced. |
| Evidence safety | Evidence snapshots redact sensitive contact details. |
| Admin queue | `/admin/reports` was added. |
| Admin decisions | Admins can review, dismiss, and resolve reports. |
| Enforcement | Admins can remove, block, suspend, and restore relevant entities. |
| Notifications | Generic notifications avoid exposing reporter identity or sensitive report details. |
| Reporter privacy | Reporter identity is protected from reported users. |

Outcome: the platform gained a moderation loop for trust, abuse response, and accountable admin action.

### Phase 3C - Production Beta Readiness and Deployment Hardening

Phase 3C prepared the app for a controlled production beta.

Completed:

| Area | Work Completed |
| --- | --- |
| Env validation | Environment validation was added for public and server Firebase config. |
| Logging | Safe server logging avoids exposing secrets. |
| API helpers | Shared API helpers were added for method and payload handling. |
| Admin readiness | `/admin/beta-readiness` was added. |
| Operations guide | Admin operations documentation was added. |
| Demo seed | Demo seed script was added for safer testing. |
| Payload guards | Payload-size guards were added. |
| QA checklist | Beta QA checklist was created. |
| Readiness report | Beta readiness report was created. |
| Smoke checklist | Production smoke checklist was added. |

Outcome: the product gained operational readiness artifacts and safer server behavior for production beta.

### Phase 4A - Vercel Production Deployment and Beta Launch Setup

Phase 4A prepared the app for Vercel deployment and production configuration.

Completed:

| Area | Work Completed |
| --- | --- |
| Deployment guide | `VERCEL_DEPLOYMENT.md` was added. |
| App URL | `NEXT_PUBLIC_APP_URL` support was added. |
| URL helper | `app/lib/app-url.ts` was created. |
| Vercel env guide | Required Vercel environment variables were documented. |
| Firebase domains | Firebase authorized domain notes were documented. |
| Smoke checklist | Production smoke testing steps were documented. |
| Beta launch checklist | Beta launch workflow was documented. |
| Legal placeholders | Terms, Privacy, and policy placeholders were identified. |

Outcome: the project gained the deployment documentation and URL handling needed for a production beta.

### Phase 4B - Actual Vercel Production Deployment and Fixes

Phase 4B completed the production deployment and hardened production runtime behavior.

Completed:

| Area | Work Completed |
| --- | --- |
| Vercel deployment | Production deployment completed. |
| Production URL | `https://firsttake-lovable.vercel.app` is live. |
| Firebase Auth domain | Firebase Auth authorized domain setup was completed. |
| Public Firebase env | Public Firebase env loading was fixed for Vercel builds by using direct `NEXT_PUBLIC_*` references in client config validation. |
| Admin SDK bundling | Firebase Admin was externalized for server runtime and server-only boundaries were added. |
| Admin dependency compatibility | Firebase Admin dependency compatibility was hardened for Vercel by using a compatible Admin SDK dependency path. |
| Final status | Production app is working as a beta foundation. |

Outcome: the app reached a working production beta foundation on Vercel with Firebase production services connected.

## Feature List by User Role

### Talent Features

| Feature | Description |
| --- | --- |
| Signup/login | Talent users can create accounts and sign in. |
| Talent profile | Talent can build professional profile details. |
| Profile completeness | Talent can see completion percentage, missing fields, and next actions. |
| Verification | Talent can submit profiles for verification when ready. |
| Media portfolio | Talent can upload profile photos, portfolio images, and showreel links. |
| Public profile | Talent can publish a shareable profile page. |
| Audition discovery | Talent can browse and filter auditions. |
| Saved auditions | Talent can save auditions for later. |
| Apply/withdraw | Talent can apply for and withdraw from auditions. |
| Applications page | Talent can track application status. |
| Messaging | Talent can message recruiters through application-linked conversations. |
| Notifications | Talent can receive activity and status updates. |
| Reports | Talent can report unsafe or abusive content or behavior. |

### Recruiter Features

| Feature | Description |
| --- | --- |
| Signup/login | Recruiters can create accounts and sign in. |
| Recruiter profile | Recruiters can create company or casting profiles. |
| Verification | Recruiters can submit for platform verification. |
| Create/manage auditions | Approved recruiters can publish and manage casting calls. |
| Applicant pipeline | Recruiters can review, filter, rate, tag, and move applicants through statuses. |
| Applicant media preview | Recruiters can review applicant media where visibility allows. |
| Messaging | Recruiters can message talent through application-linked conversations. |
| Notifications | Recruiters can receive application, message, and moderation updates. |
| Reports | Recruiters can report unsafe or abusive content or behavior. |

### Admin Features

| Feature | Description |
| --- | --- |
| Admin dashboard | Admins can review platform status and queues. |
| Verification queues | Admins can process recruiter and talent verification. |
| Talent trust | Admins can approve, reject, suspend, or restore talent. |
| User management | Admins can manage user trust and access states. |
| Audition moderation | Admins can review and moderate auditions. |
| Media moderation | Admins can review and moderate media. |
| Messaging moderation | Admins can inspect and act on unsafe messaging cases. |
| Reports queue | Admins can handle user reports. |
| Audit logs | Admin actions are logged for accountability. |
| Beta readiness page | Admins can review beta readiness signals. |
| Suspend/restore users | Admins can suspend and restore platform users. |
| Disable public profiles | Admins can disable public talent profiles when necessary. |
| Block conversations | Admins can block unsafe conversations. |

### Public / Visitor Features

| Feature | Description |
| --- | --- |
| Home page | Visitors can reach the product entry point. |
| Public talent profiles | Visitors can view enabled public talent profiles. |
| Public reporting | Visitors/users can report public profile concerns. |
| Auth entry points | Visitors can access login and signup flows. |

## Technical Architecture

| Layer | Technology / Role |
| --- | --- |
| Frontend framework | Next.js App Router |
| UI runtime | React |
| Language | TypeScript |
| Client auth/data | Firebase client SDK |
| Server privileged access | Firebase Admin SDK |
| Auth provider | Firebase Authentication |
| Database | Cloud Firestore |
| Media storage | Firebase Storage |
| Hosting | Vercel |
| Server APIs | Next.js API route handlers |
| Security rules | Firestore rules and Storage rules |
| E2E testing | Playwright |
| Unit/policy testing | Node test runner |
| Environment config | Local `.env.local` and Vercel environment variables |

The app uses client-side Firebase SDKs for signed-in user flows and server-side Firebase Admin SDK APIs for privileged operations such as admin verification, moderation, custom claims, server-side reads, and protected writes. Vercel hosts the Next.js application and server route handlers. Firestore and Storage rules enforce direct client access boundaries, while Admin SDK APIs perform sensitive operations server-side.

## Firestore Schema Overview

| Collection / Path | Purpose |
| --- | --- |
| `users` | Core user accounts, roles, profile status, trust fields, and account metadata. |
| `auditions` | Recruiter-created casting calls and audition status fields. |
| `applications` | Talent applications to auditions, including status and pipeline fields. |
| `notifications` | User notifications and read/unread states. |
| Talent media collections | Profile photos, portfolio images, external media, visibility, and moderation metadata. |
| `recruiterVerifications` | Recruiter verification submissions and review data. |
| `publicTalentProfiles` | Sanitized public talent profile documents keyed by public slug. |
| `conversations` | Application-linked recruiter-talent conversation records. |
| `conversations/{id}/messages` | Conversation message documents. |
| `reports` | Abuse, safety, and moderation reports. |
| `reports/{id}/events` | Report handling timeline and moderation actions. |
| `auditLogs` | Admin action logs. |
| `users/{uid}/savedAuditions/{auditionId}` | Talent saved audition records. |

## Security and Trust Systems

| System | Protection |
| --- | --- |
| Firebase Auth | Provides signed-in identity for Talent, Recruiter, and Admin workflows. |
| Admin custom claims | Admin access is controlled with Firebase custom claims. |
| Role-based access | Talent, Recruiter, and Admin routes/actions are separated by role. |
| Verified recruiters | Recruiter trust gates protect audition publishing. |
| Verified talent | Talent trust badges help recruiters identify reviewed profiles. |
| Approved-only publishing | Only approved active recruiters can publish auditions. |
| Owner-only media upload | Talent media uploads are scoped to the owning user. |
| Public-only media exposure | Public profiles expose only active public-safe media. |
| Participant-only conversations | Messaging is restricted to conversation participants. |
| Reporter privacy | Reports avoid exposing reporter identity to reported users. |
| Admin-only audit logs | Audit records are restricted to admin review. |
| Firestore/Storage rules | Rules enforce read/write boundaries for client access. |
| Server-side Admin APIs | Privileged actions run through secure server route handlers. |

## Testing and Verification Summary

Current verification standards include:

| Check | Purpose |
| --- | --- |
| `npm run lint` | Static code and style validation. |
| `npm test` | Node test runner unit and policy tests. |
| `npm run build` | Production build validation. |
| `npm run emulators:test` | Firestore and Storage emulator rules tests where available. |
| `npm run test:e2e` | Playwright end-to-end browser tests where stable. |
| `git diff --check` | Whitespace and patch hygiene check. |
| Production smoke tests | Manual verification against deployed production flows. |

Latest verified counts during development:

| Milestone | Test count |
| --- | --- |
| Phase 4A | 51 tests |
| Firebase env fix | 52 tests |
| Admin bundling fix | 53 tests |

These counts represent verified development checkpoints and may change as the product gains more tests.

## Deployment Summary

| Area | Detail |
| --- | --- |
| Firebase project | `nata-connect-prod` |
| Production URL | `https://firsttake-lovable.vercel.app` |
| GitHub repo | `jayeess/Firsttake-Lovable` |
| Hosting | Vercel |
| Branch workflow | Main branch is intended for production auto-deploy. |
| Preview workflow | Feature branches can be deployed as Vercel previews. |
| Local workflow | Run locally with `.env.local`, Firebase local config, and Next dev server. |

### Firebase Deploy Commands

Use these when rules or indexes change:

```powershell
npx firebase-tools deploy --only firestore:rules --project nata-connect-prod
npx firebase-tools deploy --only firestore:indexes --project nata-connect-prod
npx firebase-tools deploy --only storage --project nata-connect-prod
```

### Vercel Environment Variable Requirements

Public browser variables:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_APP_URL
```

Server-only variables:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

Do not expose server-only Firebase Admin values in browser code or public logs.

## Known Limitations / Future Work

| Area | Future Need |
| --- | --- |
| Legal | Full Terms of Service and Privacy Policy are required before wider launch. |
| Domain | Custom domain setup is pending. |
| Analytics | Analytics and monitoring can be improved. |
| Payments | Payment/subscription plans are not added yet. |
| Search | Advanced external search service is not added yet. |
| Mobile | Full mobile app is not built yet. |
| Moderation AI | Advanced AI moderation is not added yet. |
| Email/SMS | Email and SMS notification delivery are not fully integrated unless added separately. |
| Beta scale | Beta users should be limited initially to preserve support quality and collect feedback. |

## Recommended Next Phases

| Phase | Focus |
| --- | --- |
| Phase 4C - Beta User Setup and Launch Operations | Invite controlled beta users, define admin routines, collect feedback, and track support issues. |
| Phase 4D - Custom Domain, Branding, and Public Launch Polish | Add custom domain, refine branding, strengthen public pages, and finalize launch copy. |
| Phase 5A - Analytics, Metrics, and Admin Insights | Add product analytics, recruiter/talent funnel metrics, and admin insight dashboards. |
| Phase 5B - Advanced Recruiter Tools | Add saved applicant lists, bulk actions, advanced pipeline analytics, and team collaboration. |
| Phase 5C - Mobile App or PWA Enhancements | Improve mobile usability, installability, push notifications, and offline-friendly interactions. |
| Phase 6 - Monetization / Subscription Plans | Add paid recruiter plans, featured listings, premium talent tools, and billing workflows. |

## Final Conclusion

Nata Connect / FirstTake has reached a working production beta foundation. The platform now includes role-based onboarding, verified recruiter and talent trust systems, audition publishing, applications, applicant pipeline management, media portfolios, public talent profiles, notifications, messaging, reports, moderation, audit logs, production deployment documentation, and Vercel/Firebase production hardening.

The next priority is controlled beta operation: invite a small group of real users, monitor core flows, collect feedback, strengthen legal and support readiness, and polish the public launch experience before wider market release.
