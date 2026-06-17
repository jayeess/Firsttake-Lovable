import Link from 'next/link';
import { PublicFooter } from '@/components/public-footer';
import { BrandLogo } from '@/components/brand-logo';

const supportCategories = [
  'Account access or login issues',
  'Talent or Recruiter verification questions',
  'Audition, application, or messaging confusion',
  'Report, safety, or moderation concerns',
  'Media upload or public profile issues',
  'Beta bugs and product feedback',
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#eef4f7] text-[#07111f]">
      <header className="border-b border-[#d5e0e5] bg-white/88 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo />
          </Link>
          <Link
            href="/help"
            className="rounded-md border border-[#b8c7cd] px-4 py-2 text-sm font-black hover:border-[#008ca6]"
          >
            Help
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="eyebrow">Beta support</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
            Contact Nata Connect support.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#526874]">
            During beta, support workflows are still being defined. Use the
            placeholder address below for planning and replace it before wider
            launch.
          </p>
          <div className="mt-7 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            Beta placeholder support email:{' '}
            <span className="font-black">support@example.com</span>. Replace
            this with the real monitored support inbox before public launch.
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/help" className="primary-button sm:w-auto">
              Open Help Center
            </Link>
            <Link
              href="/safety"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#008ca6] px-5 py-3 font-black text-[#006d82]"
            >
              Safety guidance
            </Link>
          </div>
        </div>

        <aside className="surface rounded-md p-6">
          <p className="eyebrow">Support categories</p>
          <ul className="mt-4 grid gap-3">
            {supportCategories.map((category) => (
              <li
                key={category}
                className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3 font-bold"
              >
                {category}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-6 text-[#657176]">
            Response expectations are beta-stage placeholders. For urgent
            danger or legal emergencies, contact appropriate local emergency or
            legal services.
          </p>
        </aside>
      </section>

      <PublicFooter />
    </main>
  );
}
