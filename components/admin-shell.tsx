'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ClipboardCheck,
  FileText,
  Gauge,
  MessageSquareWarning,
  ScrollText,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { BrandLogo } from './brand-logo';
import { NotificationBell } from './notification-bell';

const navGroups = [
  {
    label: 'Overview',
    links: [
      ['/admin', 'Dashboard', Gauge],
      ['/admin/beta-readiness', 'Beta readiness', ClipboardCheck],
      ['/admin/beta-feedback', 'Beta feedback', MessageSquareWarning],
    ],
  },
  {
    label: 'Verification',
    links: [
      ['/admin/verifications', 'Recruiter verifications', UserCheck],
      ['/admin/talents', 'Talent verifications', UserCheck],
    ],
  },
  {
    label: 'Moderation',
    links: [
      ['/admin/reports', 'Reports', ShieldAlert],
      ['/admin/auditions', 'Auditions', FileText],
      ['/admin/messages', 'Messages', MessageSquareWarning],
    ],
  },
  {
    label: 'Users',
    links: [['/admin/users', 'User management', Users]],
  },
  {
    label: 'System',
    links: [['/admin/audit-logs', 'Audit logs', ScrollText]],
  },
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
    <div className="min-h-screen bg-[#eef4f7] text-[#07111f] lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-[#07111f] p-4 text-white lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <BrandLogo light />
          <NotificationBell dark />
        </div>
        <p className="mt-5 border-l-2 border-[#e7ad2d] pl-3 text-xs font-black uppercase text-white/45">
          Trust and safety
        </p>
        <nav className="mt-5 grid max-h-[58vh] gap-4 overflow-y-auto pr-1 lg:max-h-none" aria-label="Admin navigation">
          {navGroups.map((group) => (
            <section key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-black uppercase text-white/35">
                {group.label}
              </p>
              <div className="grid gap-1">
                {group.links.map(([href, label, Icon]) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`grid min-h-11 grid-cols-[28px_1fr] items-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold ${
                        active
                          ? 'bg-[#102438] text-[#55e6f7] shadow-[inset_3px_0_0_#00c2e0]'
                          : 'text-white/65 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="mt-7 block border-t border-white/10 pt-5 text-sm font-bold text-[#ffd66d]"
        >
          Exit admin workspace
        </Link>
      </aside>
      <main className="min-w-0 p-4 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
