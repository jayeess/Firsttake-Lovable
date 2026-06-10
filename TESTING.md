# Nata Connect development test cases

The login and signup screens display a small test-case panel only while running
`npm run dev`.

Talent profile, recruiter profile, and audition creation forms also include
mock-data presets. The presets fill fields only; they do not save or publish
anything automatically.

## Account personas

All valid personas use the password `FirstTake1!`.

- Actor: `talent.demo@example.com`
- Dancer: `dancer.demo@example.com`
- Voice artist: `voice.demo@example.com`
- Production studio: `recruiter.demo@example.com`
- Casting agency: `agency.demo@example.com`
- Theatre company: `theatre.demo@example.com`

Validation cases include a wrong password, unknown account, weak password, and
password mismatch.

Form presets include:

- Talent: screen actor, commercial dancer, voice artist, fashion model, news
  anchor, and new performer
- Recruiter: production studio, casting agency, theatre company, advertising
  agency, and audio studio
- Auditions: streaming drama, fashion campaign, voice campaign, dance film,
  live presenter, and student short film

Create the Talent and Recruiter users once from the Sign Up page. After that,
use the matching preset on the Login page.

## Testing two accounts at once

Authentication is tab-scoped. Open two separate browser windows or tabs, visit
the Login page in each, and sign in with different personas.

Older builds used browser-wide persistence. After updating, log out once in
each open Nata Connect window, then log in again. From that point, each tab
keeps its own Firebase session.

## Disable or remove

To hide the panel locally without changing code, add this to `.env.local`:

```env
NEXT_PUBLIC_SHOW_TEST_CASES=false
```

The panel is always excluded from production because it also checks
`NODE_ENV === 'development'`.

To remove it permanently, delete `components/dev-test-cases.tsx` and
`components/dev-form-presets.tsx`, then remove their imports from the forms.
They do not alter Firebase rules or production authentication.

## Automated checks

Run the full local verification suite:

```powershell
npm run verify
```

Individual commands:

```powershell
npm run lint
npm test
npm run build
```

The dependency-free Node test suite currently covers application eligibility:

- Active audition before its deadline can accept an application
- Duplicate applications are rejected
- Draft, closed, and cancelled auditions are rejected
- Expired auditions are rejected
- Missing auditions are rejected
- Rejected recruiter verification can be resubmitted
- Suspended or unapproved recruiters cannot post
- Removed auditions are hidden from discovery
- Non-admin users fail the privileged-action policy

These tests validate the shared policy used by the transactional Firestore
submission path. They do not replace Firebase security-rule or browser E2E
tests.

## Critical manual workflow

1. Create one Talent account and one Recruiter account using different tabs.
2. Complete both profiles.
3. As Recruiter, publish an active audition with a future deadline.
4. As Talent, open the audition and apply once.
5. Confirm a second application attempt is rejected.
6. Confirm the audition applicant count increases once.
7. As Recruiter, open the audition's applicant list.
8. Move the application through Viewed, Shortlisted, and Rejected.
9. As Talent, confirm each current status appears in My Applications.
10. Confirm Talent cannot access recruiter creation/review actions.
11. Confirm Recruiter cannot submit a Talent application.
12. Log out in one tab and confirm the other tab remains signed in.

Also test an expired audition and a closed audition. Neither should accept a
new application.

## Firebase deployment checks

After changing rules or indexes:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Wait for Firestore indexes to finish building, then repeat the critical
workflow. The collection-group index on `applications.talentId + createdAt` is
required by My Applications.

`firebase.json` contains Emulator Suite configuration. Automated emulator rule
tests are not yet included because the repository does not currently include
`firebase-tools` or `@firebase/rules-unit-testing` as development dependencies.

## Phase 1 manual verification

Before testing admin routes, configure the three `FIREBASE_ADMIN_*` environment
variables and run:

```powershell
npm run admin:set -- admin@example.com
```

Then verify:

1. Talent and Recruiter accounts see an unauthorized state at `/admin`.
2. The claimed Admin account can enter all five `/admin` routes.
3. Recruiter submits the text verification form.
4. Admin sees the pending request and approves it with a note.
5. Recruiter refreshes and sees approved status and the verified badge.
6. Approved Recruiter can publish an audition.
7. Admin suspends the Recruiter and posting becomes unavailable.
8. Admin restores the Recruiter.
9. Admin removes an audition and it disappears from Talent discovery.
10. Admin restores the audition.
11. Every privileged action appears in `/admin/audit-logs`.

Document upload must remain disabled while Firebase Storage billing is
unavailable.

## Security-test limitation

The nine current tests are policy/unit tests. They do not execute deployed
Firestore rules or Firebase Admin route handlers. Add
`@firebase/rules-unit-testing` and point the app at the Firebase emulators
before treating role enforcement as fully automated.
