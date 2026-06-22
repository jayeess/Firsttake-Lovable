import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { PublicFooter } from '@/components/public-footer';

export default function NotFound() {
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

      <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center">
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">
          This page does not exist.
        </h1>
        <p className="mt-4 max-w-md leading-7 text-[#657176]">
          The link may have changed, expired, or been removed. Return to the
          homepage to find your next opportunity.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="primary-button">
            Back to home
          </Link>
          <Link href="/help" className="secondary-button">
            Help center
          </Link>
        </div>
      </div>

      <PublicFooter />
    </main>
  );
}
