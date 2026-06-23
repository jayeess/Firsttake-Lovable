import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, Film, MapPin } from 'lucide-react';
import { cache } from 'react';
import { getAdminDb } from '@/app/lib/firebase-admin';
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  type PublicTalentProfile,
} from '@/app/lib/types';
import { PublicProfileShareButton } from '@/components/public-profile-share-button';
import { VerifiedBadge } from '@/components/verified-badge';
import { ReportButton } from '@/components/report-button';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PublicTalentPageProps = {
  params: Promise<{ slug: string }>;
};

const getPublicProfile = cache(async (slug: string) => {
  const lookup = getAdminDb()
    .collection('publicTalentProfiles')
    .doc(slug)
    .get()
    .then((snapshot) => {
      if (!snapshot.exists || snapshot.data()?.enabled !== true) return null;
      return snapshot.data() as PublicTalentProfile;
    });
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 5_000)
  );
  return Promise.race([lookup, timeout]);
});

export async function generateMetadata({
  params,
}: PublicTalentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug).catch(() => null);
  if (!profile) {
    return {
      title: 'Talent profile unavailable | Nata Connect',
      robots: { index: false, follow: false },
    };
  }
  const description =
    profile.bio.slice(0, 155) ||
    `${CATEGORY_LABELS[profile.category]} Talent profile on Nata Connect.`;
  return {
    title: `${profile.displayName} | Nata Connect`,
    description,
    alternates: { canonical: `/t/${profile.slug}` },
    openGraph: {
      title: `${profile.displayName} | Nata Connect`,
      description,
      type: 'profile',
      images: profile.profilePhotoUrl ? [profile.profilePhotoUrl] : [],
    },
  };
}

export default async function PublicTalentPage({
  params,
}: PublicTalentPageProps) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug).catch(() => null);
  if (!profile) notFound();

  const media = profile.media ?? [];
  const featured = media.find((item) => item.isFeatured);
  const gallery = media.filter((item) => item.type === 'image');
  const showreels = media.filter((item) => item.type !== 'image');

  return (
    <main className="min-h-screen bg-[#edf4f7] text-[#07111f]">
      <header className="border-b border-[#cbd9df] bg-[#071524] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="font-black">
            <span className="text-[#efb526]">Nata</span>{' '}
            <span className="text-[#12c5df]">Connect</span>
          </Link>
          <span className="text-xs font-black uppercase text-white/65">
            Public Talent profile
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <section className="rounded-md grid gap-7 border border-[#cbd9df] bg-white p-6 shadow-[0_20px_50px_rgba(7,21,36,0.08)] md:grid-cols-[220px_1fr] md:p-8">
          <div
            role="img"
            aria-label={`${profile.displayName} profile photo`}
            className="aspect-square w-full max-w-[220px] rounded-md border border-[#cbd9df] bg-[#dfe9ed] bg-cover bg-center"
            style={
              profile.profilePhotoUrl
                ? { backgroundImage: `url("${profile.profilePhotoUrl}")` }
                : undefined
            }
          />
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{CATEGORY_LABELS[profile.category]}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-black">{profile.displayName}</h1>
                  {profile.talentVerificationStatus === 'verified' && (
                    <VerifiedBadge subject="talent" />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PublicProfileShareButton />
                <ReportButton
                  targetType="publicProfile"
                  targetId={profile.slug}
                  label="Report profile"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#53656d]">
              <span>{EXPERIENCE_LABELS[profile.experienceLevel]}</span>
              {profile.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin aria-hidden="true" size={16} />
                  {profile.location}
                </span>
              )}
            </div>
            <p className="mt-6 max-w-3xl whitespace-pre-line leading-7 text-[#42545c]">
              {profile.bio}
            </p>
            {((profile.skills ?? []).length > 0 ||
              (profile.languages ?? []).length > 0) && (
              <div className="mt-6 space-y-3">
                {(profile.skills ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#7b8a90]">Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(profile.skills ?? []).map((item) => (
                        <span
                          key={item}
                          className="rounded-md border border-[#bfd0d7] bg-[#f4f8fa] px-3 py-1 text-xs font-black"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.languages ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-[#7b8a90]">Languages</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(profile.languages ?? []).map((item) => (
                        <span
                          key={item}
                          className="rounded-md border border-[#9fc9c4] bg-[#edf7f5] px-3 py-1 text-xs font-black text-[#006b60]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {(featured || gallery.length > 0 || showreels.length > 0) && (
          <section className="mt-7 rounded-md border border-[#cbd9df] bg-white px-6 py-8 md:px-8">
            <div className="flex items-center gap-3">
              <Film aria-hidden="true" className="text-[#008ca6]" />
              <h2 className="text-2xl font-black">Selected work</h2>
            </div>
            {gallery.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((item) => (
                  <article
                    key={item.id}
                    className="group border border-[#d3dfe4] bg-[#f6f9fa]"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div
                        role="img"
                        aria-label={item.title}
                        className="aspect-video bg-[#dfe9ed] bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.url}")` }}
                      />
                      <div className="px-4 pt-4">
                        <h3 className="font-black group-hover:text-[#008ca6]">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-2 text-sm text-[#617078]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </a>
                    <div className="px-4 pb-4 pt-3">
                      <ReportButton
                        targetType="media"
                        targetId={`${profile.slug}:${item.id}`}
                        label="Report media"
                        compact
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
            {showreels.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {showreels.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-md border border-[#cbd9df] p-4 font-black hover:border-[#008ca6]"
                  >
                    {item.title}
                    <ExternalLink aria-hidden="true" size={17} />
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {(profile.instagramUrl || profile.youtubeUrl || profile.websiteUrl) && (
          <section className="mt-7 rounded-md border border-[#cbd9df] bg-white p-6 md:p-8">
            <h2 className="text-xl font-black">Professional links</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                ['Instagram', profile.instagramUrl],
                ['YouTube', profile.youtubeUrl],
                ['Portfolio', profile.websiteUrl],
              ].map(
                ([label, url]) =>
                  url && (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button inline-flex items-center gap-2"
                    >
                      {label}
                      <ExternalLink aria-hidden="true" size={15} />
                    </a>
                  )
              )}
            </div>
          </section>
        )}
        <p className="mt-8 text-center text-sm text-[#7b8a90]">
          Casting inquiries go through{' '}
          <Link href="/auth/login" className="font-bold text-[#008ca6] hover:underline">
            Nata Connect
          </Link>
          . Sign up as a Recruiter to post auditions and message Talent directly.
        </p>
      </div>
    </main>
  );
}
