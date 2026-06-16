# Admin UX QA Checklist

Use this checklist before beta invites and after each admin-console change.

## Access And Route Protection

- Signed-out users visiting `/admin`, `/admin/verifications`, `/admin/talents`, `/admin/users`, `/admin/auditions`, `/admin/messages`, `/admin/reports`, `/admin/audit-logs`, and `/admin/beta-readiness` are redirected to `/auth/login`.
- Signed-in non-admin Talent and Recruiter accounts see the restricted workspace message and cannot access admin data.
- Admin accounts with the Firebase custom claim can load every admin route.
- The notification bell does not keep auth loading forever.

## Navigation And Information Architecture

- Admin sidebar groups routes into Overview, Verification, Moderation, Users, and System.
- Active route state is visible.
- Sidebar remains usable on desktop, tablet, and narrow browser widths.
- "Exit admin workspace" returns to the normal app workspace.

## Dashboard

- `/admin` shows the highest-priority queues first.
- Pending recruiter and Talent verification counts link to the correct queues.
- Suspended user and active audition metrics are visible.
- Recent audit activity is readable without exposing secret values.

## Verification Queues

- `/admin/verifications` clearly separates approve/reject from suspend/restore.
- Recruiter legal name, email, contact, business type, website, social proof, and work description are visible.
- `/admin/talents` shows Talent verification status, completeness score, verified badge, public profile state, and portfolio moderation actions.
- Rejection and suspension actions require a review reason.

## Moderation

- `/admin/reports` shows priority, status, target type, reporter, target owner, sanitized evidence, and report audit trail.
- Report case handling actions are visually separate from target enforcement actions.
- `/admin/auditions` shows visible versus removed counts and separates remove from restore.
- `/admin/messages` shows conversation metadata only and clearly separates thread blocking from normal review.

## Users And Audit Logs

- `/admin/users` supports email/UID search and role filtering.
- User cards are usable on smaller screens; the table remains efficient on desktop.
- Suspend and restore actions are visibly different.
- `/admin/audit-logs` supports filtering by action and shows actor, target, note/reason, and enforcement event counts.

## Beta Readiness

- `/admin/beta-readiness` shows Firebase/public env/server env readiness without exposing values.
- Manual launch review areas include production status, Firebase, Vercel, auth/security, content/legal, support, user testing, and limitations.
- Production commands remain copyable for internal launch operators.

## Regression Checks

- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Run `git diff --check`.
- Run `npm run test:e2e` when the Playwright environment is stable.
