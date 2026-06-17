import Link from 'next/link';
import { BrandLogo } from './brand-logo';
import { PublicFooter } from './public-footer';

export type InfoSection = {
  title: string;
  body: string;
};

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  notice,
  sections,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  notice?: string;
  sections: InfoSection[];
  cta?: { href: string; label: string };
}) {
  return (
    <main className="min-h-screen bg-[#eef4f7] text-[#07111f]">
      <header className="border-b border-[#d5e0e5] bg-white/88 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo />
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border border-[#b8c7cd] px-4 py-2 text-sm font-black hover:border-[#008ca6]"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#526874]">
          {description}
        </p>
        {notice && (
          <div className="mt-7 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            {notice}
          </div>
        )}
        {cta && (
          <Link href={cta.href} className="primary-button mt-7 sm:w-auto">
            {cta.label}
          </Link>
        )}
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-16">
        {sections.map((section) => (
          <article key={section.title} className="surface rounded-md p-6">
            <h2 className="text-xl font-black">{section.title}</h2>
            <p className="mt-3 leading-7 text-[#526874]">{section.body}</p>
          </article>
        ))}
      </section>

      <PublicFooter />
    </main>
  );
}
