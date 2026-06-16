# Nata Connect Vercel Deployment Guide

This guide prepares the `nata-connect-prod` Firebase-backed app for a clean
Vercel production beta deployment. Do not commit secrets, service account JSON,
`.env.local`, `.env.e2e.local`, Firebase private keys, or debug logs.

## 1. Pre-Deployment Readiness

- Confirm `npm run build` passes locally.
- Confirm `npm run lint`, `npm test`, `npm run emulators:test`, and
  `npm run test:e2e` pass or have only expected credential-backed skips.
- Confirm Firestore rules, Storage rules, and indexes are already deployed.
- Confirm the Firebase project remains `nata-connect-prod`.
- Confirm the admin custom claim is already set for the launch admin account.
- Confirm no secret files appear in `git status --short`.

## 2. Vercel Project Setup

1. Push the latest `main` branch to GitHub.
2. Open Vercel and import the connected GitHub repository.
3. Keep the framework preset as **Next.js**.
4. Use the default build command:

```text
npm run build
```

5. Add the environment variables below.
6. Deploy.
7. Open the Vercel production URL.
8. Run the production smoke test checklist in this document.

## 3. Required Environment Variables

Add these in Vercel Project Settings -> Environment Variables. Apply them to
Production, and also Preview/Development if you want those environments to use
Firebase.

Public Firebase web variables:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Server/Admin SDK variables:

```text
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

Optional app URL:

```text
NEXT_PUBLIC_APP_URL
```

Use the exact Firebase web app config for `nata-connect-prod`. For
`FIREBASE_ADMIN_PRIVATE_KEY`, paste the private key as one value with newline
escapes such as `\n`, or use Vercel's multiline value support. The app converts
escaped newlines safely at runtime. Never expose this key through
`NEXT_PUBLIC_`.

Before a custom domain is connected, set `NEXT_PUBLIC_APP_URL` to the Vercel
production URL, for example:

```text
https://your-project.vercel.app
```

After adding a custom domain, update it to the custom HTTPS URL.

## 4. Firebase Auth Authorized Domains

If login or signup shows a domain/redirect error after deployment:

1. Open Firebase Console.
2. Go to Authentication -> Settings -> Authorized domains.
3. Add the Vercel production domain.
4. Add the custom domain later after it is connected.

Do not attempt to automate this from the app.

## 5. Firebase Deploy Commands

If Firestore rules or indexes changed:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project nata-connect-prod
```

If Storage rules changed:

```powershell
npx firebase-tools deploy --only storage --project nata-connect-prod
```

If only app/docs/tests changed, no Firebase deploy is needed.

## 6. Production Smoke Test Checklist

- Home page loads.
- Signup works.
- Login works.
- Logout works.
- Admin login works.
- Admin dashboard loads.
- `/admin/beta-readiness` loads for admin only.
- Recruiter verification page works.
- Talent profile loads and saves.
- Talent media upload works.
- Public profile `/t/[slug]` works.
- Auditions list loads.
- Recruiter can post an audition.
- Talent can apply to an audition.
- Recruiter can view applicants.
- Applicant pipeline actions work.
- Messaging works.
- Notifications work.
- Report modal works.
- Admin reports page works.
- Admin moderation actions work.
- Mobile layout quick check passes.
- Chrome and Edge quick checks pass.

## 7. Beta Launch Checklist

- One admin account is ready and has the admin custom claim.
- One recruiter test account is ready.
- One Talent test account is ready.
- One sample audition is created.
- Support/contact email is prepared.
- Beta user invitation message is prepared.
- Known limitations are documented.
- Privacy/terms placeholder decision is documented.
- Emergency actions are rehearsed:
  - disable public profile
  - suspend user
  - remove audition
  - block conversation
  - hide media

## 8. Legal and Policy Placeholders

These are not legal advice, but they are launch-readiness requirements before a
wider public launch:

- Terms of Service needed.
- Privacy Policy needed.
- Community Guidelines / Platform Safety Rules needed.
- Report abuse process documented.
- Data deletion request process needed.
- Minor safety policy must be reviewed carefully before public launch.

For the beta, keep invitations controlled and avoid representing these
placeholders as complete legal documents.

## 9. Rollback Guidance

- Redeploy the last known good Vercel deployment from the Vercel dashboard.
- If rules/indexes were changed, redeploy the previous known good Firebase rules
  and index configuration.
- Use admin emergency actions to reduce immediate risk while investigating.
- Preserve audit logs and report records.

## 10. Production Safety Review

- No secret files committed.
- `.env.local` remains ignored.
- `.env.e2e.local` remains ignored.
- Firebase rules deployed.
- Storage rules deployed.
- Indexes deployed.
- Admin SDK env present in Vercel.
- Build passes locally.
- E2E route protection passes.
- Admin custom claim configured.
- Reports/moderation working.
- Emergency suspend/remove/block/hide actions working.
