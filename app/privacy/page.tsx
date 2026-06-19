import { PublicInfoPage } from '@/components/public-info-page';

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Beta privacy notice"
      title="Privacy Policy"
      description="This draft explains the main types of data Nata Connect may process during beta testing and how visibility works."
      notice="This beta policy is provided for product testing and should be reviewed by a qualified legal professional before wider launch. It is not legal advice."
      sections={[
        {
          title: 'Information Collected',
          body: 'Nata Connect may collect account details, profile information, role type, verification status, audition activity, application activity, messages, reports, and operational logs needed to run the service.',
        },
        {
          title: 'Account and Profile Information',
          body: 'Talent and Recruiter profiles may include names, company details, location, category, experience, bio, links, status, and trust indicators. Some fields are visible to other users depending on the workflow.',
        },
        {
          title: 'Media Uploads',
          body: 'Portfolio photos, videos, links, and related metadata may be stored and moderated. Public profile media should only appear when the user chooses public visibility and the platform allows it.',
        },
        {
          title: 'Audition and Application Data',
          body: 'Casting calls, saved auditions, applications, cover messages, review states, and applicant pipeline decisions may be processed to support Talent and Recruiter workflows.',
        },
        {
          title: 'Messaging and Report Data',
          body: 'In-platform conversations, report records, sanitized evidence snapshots, moderation notes, and audit logs may be processed to support safety and dispute review.',
        },
        {
          title: 'How Data Is Used',
          body: 'Data is used to authenticate users, operate casting workflows, show relevant opportunities, support verification, prevent abuse, send notifications, and improve beta product quality.',
        },
        {
          title: 'Sharing and Visibility',
          body: 'Profile, audition, and application information is shared only where the product workflow requires it. Admin-only review notes, reports, and audit details are not public.',
        },
        {
          title: 'Public Profile Visibility',
          body: 'Talent may choose to publish a public profile. Public profiles should only include approved public information and media, and can be disabled by the user or moderation when needed.',
        },
        {
          title: 'Data Deletion and Contact Requests',
          body: 'During beta, users can request support for account or data concerns through the Contact page. A formal deletion/export workflow should be completed before wider launch.',
        },
        {
          title: 'Security',
          body: 'The product uses secure sign-in, role checks, server-side moderation tools, security rules, and audit controls, but no beta system should be treated as risk-free.',
        },
        {
          title: 'Minors and Guardian Note',
          body: 'Younger users should involve a parent or guardian before using the platform, sharing media, messaging recruiters, applying to roles, or attending auditions.',
        },
      ]}
    />
  );
}
