'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { BrandLogo } from './brand-logo';
import { NotificationBell } from './notification-bell';

const links = [
  ['/admin', 'Overview'],
  ['/admin/verifications', 'Verifications'],
  ['/admin/talents', 'Talent trust'],
  ['/admin/users', 'Users'],
  ['/admin/auditions', 'Auditions'],
  ['/admin/messages', 'Messages'],
  ['/admin/reports', 'Reports'],
  ['/admin/audit-logs', 'Audit logs'],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, router, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] font-bold text-white/70">
        Verifying administrator access...
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef4f7] p-6">
        <section className="surface max-w-lg p-8 text-center">
          <p className="eyebrow">Restricted workspace</p>
          <h1 className="mt-3 text-3xl font-black">Administrator access required</h1>
          <p className="mt-3 leading-7 text-[#657176]">
            This account does not have the trusted Firebase admin claim. Normal
            Talent and Recruiter accounts cannot enter moderation tools.
          </p>
          <Link href="/dashboard" className="primary-button mt-6">
            Return to workspace
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef4f7] text-[#07111f] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-white/10 bg-[#07111f] p-5 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-3">
          <BrandLogo light />
          <NotificationBell dark />
        </div>
        <p className="mt-5 border-l-2 border-[#e7ad2d] pl-3 text-xs font-black uppercase text-white/45">
          Trust and safety
        </p>
        <nav className="mt-6 grid gap-1">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`min-h-11 rounded-md px-4 py-3 text-sm font-bold ${
                pathname === href
                  ? 'bg-[#102438] text-[#55e6f7]'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="mt-7 block border-t border-white/10 pt-5 text-sm font-bold text-[#ffd66d]"
        >
          Exit admin workspace
        </Link>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
