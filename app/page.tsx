import Image from 'next/image';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export default function Home() {
  return (
    <main className="bg-[#eef4f7] text-[#07111f]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5">
          <BrandLogo light />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/auth/login"
              className="min-h-11 px-3 py-3 text-sm font-bold text-white/80 hover:text-white sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-[#e7ad2d] px-3 py-3 text-sm font-black text-[#07111f] hover:bg-[#ffd062] sm:px-4"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-[#07111f]">
        <Image
          src="/nata-connect-brand-poster.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-48"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(7,17,31,0.9)_48%,rgba(7,17,31,0.56)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,17,31,0.98)_0%,rgba(7,17,31,0.88)_42%,rgba(7,17,31,0.28)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 text-white">
          <p className="text-sm font-black uppercase text-[#55e6f7]">
            Cinema craft meets connected opportunity
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] sm:text-6xl lg:text-7xl">
            Talent finds its stage.
            <br />
            Casting finds its people.
          </h1>
          <p lang="te" className="mt-5 text-2xl font-bold text-[#ffd66d]">
            నట కనెక్ట్
          </p>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
            One professional network for artists, production teams, auditions,
            applications, and casting decisions.
          </p>
          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/auth/signup" className="primary-button px-7 sm:w-auto">
              Create your profile
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#00c2e0]/55 px-7 py-3 font-bold text-[#8cebf6] hover:bg-[#00c2e0]/10"
            >
              Open workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl px-5 py-14 lg:grid-cols-3">
        {[
          ['01', 'Discover the right work', 'Explore structured casting calls with clear requirements, deadlines, and project context.'],
          ['02', 'Present real capability', 'Build a professional talent portfolio or a credible production-company profile.'],
          ['03', 'Move casting forward', 'Track applications and manage talent through review, shortlist, and decision stages.'],
        ].map(([number, title, body]) => (
          <article
            key={number}
            className="border-t border-[#bfcfd6] py-7 lg:border-l lg:border-t-0 lg:px-8 first:lg:border-l-0"
          >
            <p className="text-xs font-black text-[#008ca6]">{number}</p>
            <h2 className="mt-4 text-2xl font-black">{title}</h2>
            <p className="mt-3 max-w-sm leading-7 text-[#5b6e78]">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-2">
        {[
          [
            'For Talent',
            'Build a trusted profile, upload your portfolio, save auditions, apply, track every status, and message recruiters safely.',
          ],
          [
            'For Recruiters',
            'Publish verified casting calls, review applicant cards, manage shortlists, preview media, and keep decisions organized.',
          ],
          [
            'Trust and verification',
            'Recruiter and Talent verification, badges, audit logs, reports, and moderation protect serious users.',
          ],
          [
            'Public profiles',
            'Talent can share a clean public profile with only approved public media and privacy-aware profile details.',
          ],
        ].map(([title, body]) => (
          <article key={title} className="surface rounded-md p-6">
            <p className="eyebrow">{title}</p>
            <p className="mt-3 text-lg font-black leading-snug text-[#07111f]">
              {body}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-[#07111f] px-5 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase text-[#55e6f7]">
              Built for Telugu cinema and beyond
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black">
              Professional profiles. Clear auditions. Better connections.
            </h2>
          </div>
          <Link href="/auth/signup" className="primary-button shrink-0 sm:w-auto">
            Join the network
          </Link>
        </div>
      </section>

      <footer className="px-5 py-8 text-center text-sm font-semibold text-[#657176]">
        Built for trusted casting, safer communication, and professional talent discovery.
      </footer>
    </main>
  );
}
