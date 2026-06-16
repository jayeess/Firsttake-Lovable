import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#eef4f7] lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#07111f] bg-cover bg-center p-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ backgroundImage: "url('/nata-connect-brand-poster.png')" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.45),rgba(7,17,31,0.92))]" />
        <Link href="/" className="relative z-10">
          <BrandLogo light />
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-black uppercase text-[#55e6f7]">
            Where talent meets opportunity
          </p>
          <blockquote className="mt-5 text-4xl font-black leading-tight">
            Every memorable performance begins with one brave first take.
          </blockquote>
          <p lang="te" className="mt-5 text-xl font-bold text-[#ffd66d]">
            నట కనెక్ట్
          </p>
          <p className="mt-4 max-w-md leading-7 text-white/75">
            A focused workspace for artists building careers and casting teams
            finding the right person for the role.
          </p>
        </div>
        <p className="relative z-10 text-xs font-bold uppercase text-white/55">
          Profiles | Casting calls | Decisions
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-4 py-8 sm:p-10 lg:bg-white/82">
        <div className="w-full max-w-xl">
          <Link href="/" className="mb-8 inline-block lg:hidden">
            <BrandLogo />
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#657176] sm:text-base sm:leading-7">
            {description}
          </p>
          <div className="mt-6 sm:mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
