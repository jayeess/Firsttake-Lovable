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
