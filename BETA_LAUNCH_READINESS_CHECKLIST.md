# Beta Launch Readiness Checklist

This checklist is for a controlled Nata Connect / FirstTake beta. It is not a legal compliance certificate. Final legal, privacy, and safety review is still required before wider public launch.

## Pre-Launch Checklist

- Confirm latest production deployment is live on Vercel.
- Confirm Firebase production project is connected.
- Confirm public Firebase env vars are present in Vercel.
- Confirm server-only Firebase Admin env vars are present in Vercel.
- Run `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`.
- Confirm Firestore rules and indexes are deployed if rules/indexes changed.
- Confirm admin account has the Firebase custom admin claim.
- Confirm admin dashboard, beta readiness, audit logs, reports, users, and feedback pages load.

## Legal And Safety Checklist

- Review `/terms`.
- Review `/privacy`.
- Review `/community-guidelines`.
- Review `/safety`.
- Replace beta placeholder language with lawyer-reviewed copy before wider launch.
- Confirm "never pay to audition" warning is visible.
- Confirm emergency disclaimer is visible on Safety and Feedback surfaces.
- Confirm report handling process is documented for admins.
- Confirm support owner understands escalation flow for harassment, scams, unsafe contact, and minors.

## Support Checklist

- Replace `support@example.com` with a real monitored inbox.
- Define response expectations for beta users.
- Define support categories and owners.
- Confirm `/contact` and `/help` are accessible from public/auth footers.
- Confirm `/beta-feedback` can collect bugs, confusion, feature requests, general feedback, and safety notes.
- Confirm admins can review `/admin/beta-feedback`.

## Talent Test Journey

- Create or use a demo Talent account.
- Log in and confirm dashboard redirects correctly.
- Complete Talent profile.
- Add safe portfolio/media details.
- Submit Talent verification if eligible.
- Browse auditions.
- Save an audition.
- Apply to an audition.
- Confirm application appears in My Applications.
- Confirm Talent can message only through eligible application-linked workflows.
- Submit beta feedback from the Talent session.

## Recruiter Test Journey

- Create or use a demo Recruiter account.
- Complete company profile.
- Submit recruiter verification.
- Approve recruiter from admin.
- Create a sample audition.
- Confirm audition appears in Talent discovery.
- Review a Talent application.
- Move applicant through pipeline states.
- Message the applicant through the platform.
- Submit beta feedback from the Recruiter session.

## Admin Test Journey

- Log in with admin claim.
- Review dashboard queue counts.
- Approve/reject recruiter verification.
- Verify/reject/suspend/restore Talent verification.
- Remove/restore an audition.
- Review reports and resolve/dismiss safely.
- Block a conversation if needed.
- Search users and suspend/restore a test account.
- Review audit logs after each privileged action.
- Review and mark beta feedback as reviewed/resolved.

## Mobile Smoke Test Checklist

- Load landing page on mobile width.
- Load auth login/signup pages.
- Load dashboard as Talent and Recruiter.
- Browse auditions.
- Apply to an audition.
- View My Applications.
- Edit Talent profile.
- View Recruiter auditions.
- Open admin pages on tablet/narrow width.
- Confirm public footer links wrap cleanly.

## Production Smoke Test Checklist

- Open production URL in a clean browser profile.
- Confirm `/auth/login` does not show missing Firebase env errors.
- Confirm signed-out protected routes redirect to `/auth/login`.
- Confirm public pages load: `/terms`, `/privacy`, `/community-guidelines`, `/safety`, `/contact`, `/help`, `/beta-feedback`.
- Confirm feedback submission succeeds.
- Confirm admin feedback review loads the new submission.
- Confirm no secrets or service-account values are visible in the browser.

## First 5 Beta Users Plan

- Invite one trusted Talent with media.
- Invite one trusted Talent without media.
- Invite one trusted Recruiter/casting team.
- Invite one admin/operator.
- Invite one observer who has not seen the product before.
- Ask each person to submit at least one feedback item through `/beta-feedback`.
- Review feedback daily during the first beta week.

## Feedback Collection Process

- New feedback lands in `betaFeedback`.
- Admins review `/admin/beta-feedback`.
- Safety feedback should be triaged before general feature requests.
- Mark feedback as reviewed after triage.
- Mark feedback as resolved only after a product, support, or policy response is complete.
- Keep sensitive user information out of feedback messages when possible.

## Known Limitations

- Legal pages are beta placeholders.
- Support inbox is currently a placeholder until replaced.
- Email/SMS delivery may be pending unless separately configured.
- Analytics and production monitoring need further improvement.
- Payments are not implemented.
- Full deletion/export privacy workflows are not complete.
- Beta feedback admin actions are intentionally simple.

## Rollback Notes

- If production launch shows severe auth, permissions, or data issues, pause invitations immediately.
- Revert the latest Vercel deployment to the previous stable deployment.
- Preserve audit logs and report records.
- Do not delete evidence related to safety reports.
- Communicate clearly to beta users if access is temporarily paused.
