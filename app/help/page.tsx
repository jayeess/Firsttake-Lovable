import { PublicInfoPage } from '@/components/public-info-page';

export default function HelpPage() {
  return (
    <PublicInfoPage
      eyebrow="Help center"
      title="Find your way through beta."
      description="Short guidance for Talent, Recruiters, and admins testing Nata Connect before wider launch."
      sections={[
        {
          title: 'Getting Started as Talent',
          body: 'Create a Talent account, complete your professional profile, add safe portfolio details, browse auditions, save roles, and apply only to opportunities that match your interests and safety comfort.',
        },
        {
          title: 'Getting Started as Recruiter',
          body: 'Create a Recruiter account, complete company onboarding, submit verification, and publish casting calls only after your account is approved for posting.',
        },
        {
          title: 'Verification Help',
          body: 'Recruiter verification checks company credibility. Talent verification checks profile completeness and trust signals. Verification is a trust indicator, not a guarantee of work or selection.',
        },
        {
          title: 'Applying to Auditions',
          body: 'Open an audition, review the requirements, write a relevant cover message, and submit your application. You can track status in My Applications.',
        },
        {
          title: 'Managing Applications',
          body: 'Talent can follow application status. Recruiters can review applicants, shortlist, reject, select, and keep pipeline decisions organized.',
        },
        {
          title: 'Messaging Safely',
          body: 'Use platform messaging for application-linked conversations. Keep all casting communication inside Nata Connect — never share personal contact details, financial information, or government ID documents in chat. Legitimate auditions do not charge fees or pressure you to move to WhatsApp, Telegram, or other apps. If a message feels unsafe, report the thread using the Report button. You are never required to respond to unsafe or pressurising messages.',
        },
        {
          title: 'Reporting Abuse',
          body: 'Use report tools or contact support when you see scams, harassment, unsafe payment requests, fake casting calls, or inappropriate content.',
        },
        {
          title: 'Media Uploads',
          body: 'Upload only media you have the right to share. Choose public visibility carefully, and avoid sensitive documents or private identity materials in portfolio media.',
        },
        {
          title: 'Account and Status Issues',
          body: 'If login, role, verification, suspension, or access state feels wrong, contact beta support with your account email and a short description of what happened.',
        },
        {
          title: 'Beta Known Limitations',
          body: 'The beta may still have manual support, evolving policies, limited analytics, limited email delivery, and changing product workflows.',
        },
      ]}
      cta={{ href: '/contact', label: 'Contact support' }}
    />
  );
}
