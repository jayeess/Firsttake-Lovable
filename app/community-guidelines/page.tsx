import { PublicInfoPage } from '@/components/public-info-page';

export default function CommunityGuidelinesPage() {
  return (
    <PublicInfoPage
      eyebrow="Trust and conduct"
      title="Community Guidelines"
      description="Nata Connect is built for professional casting work. These guidelines set the standard for how Talent, Recruiters, and production teams treat each other — and the consequences when those standards are not met."
      sections={[
        {
          title: 'Respectful Behavior',
          body: 'Treat other users as professional collaborators. Keep communication clear, relevant, and respectful, even when a role or application is not a fit.',
        },
        {
          title: 'No Harassment',
          body: 'Harassment, threats, hate speech, sexual pressure, bullying, discrimination, and repeated unwanted contact are not allowed.',
        },
        {
          title: 'No Fake Casting Calls',
          body: 'Casting calls must represent real opportunities with accurate role, deadline, location, compensation, and production context where available.',
        },
        {
          title: 'No Requests for Payment to Audition',
          body: 'Recruiters must not ask Talent to pay simply to audition, be considered, or receive a callback. Talent should report any such request.',
        },
        {
          title: 'No Unsafe Off-Platform Pressure',
          body: 'Do not pressure users to leave the platform, share private contact details, attend unsafe meetings, or move conversations into channels that avoid accountability.',
        },
        {
          title: 'No Misleading Identity',
          body: 'Do not impersonate a person, agency, studio, production company, or verified professional status. Profiles and company pages should be truthful.',
        },
        {
          title: 'No Inappropriate Content',
          body: 'Do not upload or send exploitative, explicit, abusive, stolen, misleading, or unsafe media. Portfolio content should represent professional work.',
        },
        {
          title: 'Reporting Abuse',
          body: 'Use the Report button on any audition, profile, message, or media item when something feels unsafe, misleading, suspicious, or abusive. Reports are reviewed by the Nata Connect trust team and reporter identity is kept confidential. You will receive confirmation when your report is received.',
        },
        {
          title: 'Consequences of Violations',
          body: 'Nata Connect may remove auditions, hide media, disable public profiles, block conversations, suspend accounts, or preserve audit records when platform standards are violated. Serious or repeated violations may result in permanent suspension.',
        },
      ]}
      cta={{ href: '/safety', label: 'Read safety guidance' }}
    />
  );
}
