'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <p className="eyebrow">Unexpected error</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">
          Something went wrong.
        </h1>
        <p className="mt-4 max-w-md leading-7 text-[#657176]">
          We ran into a problem loading this page. This has been noted and the
          team will look into it. You can try again or return to your workspace.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="primary-button">
            Try again
          </button>
          <Link href="/dashboard" className="secondary-button">
            Go to workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
