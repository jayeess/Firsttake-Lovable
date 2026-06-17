import { PublicInfoPage } from '@/components/public-info-page';

export default function SafetyPage() {
  return (
    <PublicInfoPage
      eyebrow="User safety"
      title="Safer casting starts with clear boundaries."
      description="Use this guidance before applying, posting, messaging, sharing media, or meeting someone connected to a casting opportunity."
      notice="Nata Connect support is not an emergency service. If you are in immediate danger, contact local emergency services or trusted local authorities."
      sections={[
        {
          title: 'Never Pay to Audition',
          body: 'A recruiter or production team should not ask you to pay simply to audition, be shortlisted, or be considered. Treat payment requests as a serious warning sign and report them.',
        },
        {
          title: 'Keep Communication On-Platform',
          body: 'Use Nata Connect messaging when possible so there is context and accountability. Be cautious if someone immediately pressures you to move to private channels.',
        },
        {
          title: 'Verify Recruiter Badges',
          body: 'Look for recruiter verification signals and complete company information. A badge is helpful, but still review the role details, production context, and behavior carefully.',
        },
        {
          title: 'Report Suspicious Behavior',
          body: 'Report fake casting calls, unsafe contact requests, harassment, inappropriate content, payment pressure, identity concerns, or anything that feels suspicious.',
        },
        {
          title: 'Protect Personal Information',
          body: 'Avoid sharing home address, government IDs, financial details, private phone numbers, or personal schedules unless you have independently verified the opportunity and need.',
        },
        {
          title: 'Younger Users Should Involve a Guardian',
          body: 'Younger Talent should involve a parent or guardian before uploading media, messaging recruiters, applying, or attending any audition or meeting.',
        },
        {
          title: 'Safe Meeting and Audition Reminders',
          body: 'Meet in professional/public settings, tell someone you trust where you are going, verify location details, and be cautious with last-minute location or requirement changes.',
        },
        {
          title: 'How Nata Connect Handles Reports',
          body: 'Reports may be reviewed by administrators. Depending on severity, the platform may remove content, block conversations, suspend accounts, or preserve audit history.',
        },
      ]}
      cta={{ href: '/beta-feedback', label: 'Share beta feedback' }}
    />
  );
}
