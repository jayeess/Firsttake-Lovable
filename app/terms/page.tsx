import { PublicInfoPage } from '@/components/public-info-page';

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Beta legal placeholder"
      title="Terms of Service"
      description="These draft terms explain the basic expectations for using Nata Connect during a controlled beta."
      notice="This is a beta placeholder and should be reviewed by a qualified legal professional before wider launch. It is not legal advice."
      sections={[
        {
          title: 'Acceptance of Terms',
          body: 'By creating an account or using Nata Connect, beta users agree to use the platform responsibly and follow these draft terms and safety policies.',
        },
        {
          title: 'Eligibility',
          body: 'Users should be old enough to use a casting and professional networking service in their location. Younger users should involve a parent or guardian before creating profiles, applying, messaging, or attending auditions.',
        },
        {
          title: 'Talent Responsibilities',
          body: 'Talent are responsible for accurate profile details, truthful portfolio media, respectful communication, and reviewing audition details carefully before applying or attending.',
        },
        {
          title: 'Recruiter Responsibilities',
          body: 'Recruiters and casting teams must post genuine opportunities, represent productions accurately, avoid misleading requirements, and never pressure Talent into unsafe or off-platform conduct.',
        },
        {
          title: 'Prohibited Conduct',
          body: 'Harassment, scams, fake casting calls, impersonation, discrimination, unsafe contact pressure, inappropriate media, spam, and attempts to bypass moderation are not allowed.',
        },
        {
          title: 'No Guarantee of Casting Selection',
          body: 'Nata Connect helps users discover opportunities and manage casting workflows. The platform does not guarantee auditions, callbacks, paid work, casting selection, or production outcomes.',
        },
        {
          title: 'No Payment-to-Audition Warning',
          body: 'Talent should never be asked to pay a recruiter, production team, or third party simply to audition or be considered for a role. Report suspicious requests immediately.',
        },
        {
          title: 'Account Suspension or Removal',
          body: 'Accounts, profiles, auditions, media, messages, or public pages may be restricted, suspended, removed, or reviewed when they appear unsafe, misleading, abusive, or inconsistent with platform rules.',
        },
        {
          title: 'Content and Media Ownership Basics',
          body: 'Users keep ownership of content they upload, but grant Nata Connect the limited permission needed to host, display, process, and moderate that content as part of the service.',
        },
        {
          title: 'Platform Limitations',
          body: 'The beta may contain bugs, incomplete workflows, manual support processes, and changing product behavior. Users should avoid relying on the platform as their only record of professional commitments.',
        },
        {
          title: 'Contact and Support',
          body: 'For questions about these draft terms, account access, or beta support, contact the team through the Contact page. Urgent safety concerns should also be reported through in-product reporting where available.',
        },
      ]}
    />
  );
}
