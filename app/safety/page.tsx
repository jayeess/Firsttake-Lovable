import { PublicInfoPage } from '@/components/public-info-page';

export default function SafetyPage() {
  return (
    <PublicInfoPage
      eyebrow="Platform safety"
      title="Safer casting, every step."
      description="Practical guidance for Talent, Recruiters, and the public. Know the warning signs, use the platform's safeguards, and report anything that feels unsafe."
      notice="Nata Connect is not an emergency service. If you are in immediate danger, contact local emergency services."
      sections={[
        {
          title: 'Never Pay to Audition',
          body: 'Legitimate casting calls on Nata Connect do not charge Talent to apply, audition, be shortlisted, or receive a callback. If anyone asks for money at any stage of the casting process — treat it as a scam and report it immediately.',
        },
        {
          title: 'Red Flags for Fake Casting Calls',
          body: 'Watch for: payment requests at any stage, pressure to move conversations off the platform, vague role descriptions with unusually high pay, no verifiable production company or recruiter profile, requests for personal documents or financial details upfront, or sudden changes in meeting location or contact method. When something feels wrong, trust your instincts and report.',
        },
        {
          title: 'Keep Communication On-Platform',
          body: 'Use Nata Connect messaging for all audition communication. Never share your home address, personal phone number, or private email in chat. If someone pressures you to move conversations off the platform, that is a warning sign — report the thread.',
        },
        {
          title: 'Verified Recruiter Trust Signals',
          body: 'Look for the "Verified recruiter" badge on casting briefs and profiles. Verified recruiters have had their company and identity reviewed by the Nata Connect trust team. A badge improves confidence, but always review role details, production context, and recruiter behavior carefully before applying.',
        },
        {
          title: 'Protect Your Personal Information',
          body: 'Do not share government IDs, financial details, home address, personal phone numbers, or private schedules in casting conversations. Your Nata Connect profile shares only what you choose to make public.',
        },
        {
          title: 'How to Report',
          body: 'Use the Report button on any audition, profile, message, or media item. Choose the reason that best describes the concern, add context if it helps, and submit. Your report goes to the Nata Connect trust team and reporter identity is kept confidential.',
        },
        {
          title: 'What Happens After You Report',
          body: 'Reports are reviewed by the Nata Connect trust team. Depending on severity, the platform may remove content, disable profiles, block conversations, suspend accounts, or preserve an audit record. You will receive a notification confirming your report was received.',
        },
        {
          title: 'Safe Meeting Reminders',
          body: 'If an audition requires an in-person meeting, use professional or public settings, inform a trusted contact of where you are going, verify the location independently, and be cautious about last-minute changes to location, time, or requirements.',
        },
        {
          title: 'Younger Talent',
          body: 'Talent under 18 should have a parent or guardian involved before messaging recruiters, submitting media, applying to auditions, or attending any in-person meeting.',
        },
      ]}
      cta={{ href: '/community-guidelines', label: 'Read community guidelines' }}
    />
  );
}
