# Changelog

All notable changes to Nata Connect are recorded here.

## Unreleased

### Added

- Tab-scoped Firebase authentication for concurrent Talent and Recruiter tests
- Development account personas and profile/audition form presets
- Recruiter applicant review and application status workflow
- Application eligibility policy tests using Node's built-in test runner
- `npm run verify` for lint, tests, and production build
- Firebase Emulator Suite configuration and `.firebaserc.example`
- Product roadmap, testing guide, setup guide, and beta-readiness report

### Changed

- Rebranded the product to Nata Connect (`నట కనెక్ట్`)
- Improved navigation, responsive layouts, visual hierarchy, and casting theme
- Application submission now uses a Firestore transaction
- Applicant counts now update atomically with application creation
- Talent application loading now uses a collection-group query instead of
  scanning every audition
- Firebase rules now constrain Talent counter updates and Recruiter status
  updates to their intended fields
- Authentication errors now use clearer user-facing messages

### Fixed

- Login redirect state update during React rendering
- Missing dashboard route after login
- Stale authentication role updates during rapid session changes
- Duplicate and invalid audition application attempts

### Security

- Application creation requires the authenticated Talent user's ID and an
  initial `APPLIED` status
- Recruiters can update only review-related application fields
- Talent users can increment only an audition's applicant counter by one

## Before Public Release

- Add trusted server-side recruiter approval using Admin SDK/custom claims
- Add Firebase Emulator security-rule tests and browser E2E coverage
- Complete media upload, moderation, notification, legal, and monitoring flows
