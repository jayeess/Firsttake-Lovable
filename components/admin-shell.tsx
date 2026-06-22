'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  FileText,
  Gauge,
  Menu,
  MessageSquareWarning,
  MoreHorizontal,
  ScrollText,
  ShieldAlert,
  UserCheck,
  Users,
  X,
  type LucideIcon,
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

type AdminNavLink = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  activePatterns?: string[];
};

const mobileAdminLinks: AdminNavLink[] = [
  {
    href: '/admin',
    label: 'Trust command center',
    shortLabel: 'Dashboard',
    icon: Gauge,
  },
  {
    href: '/admin/verifications',
    label: 'Verification queue',
    shortLabel: 'Verifications',
    icon: UserCheck,
    activePatterns: ['/admin/verifications', '/admin/talents'],
  },
  {
    href: '/admin/reports',
    label: 'Moderation review',
    shortLabel: 'Moderation',
    icon: ShieldAlert,
    activePatterns: ['/admin/reports', '/admin/auditions', '/admin/messages'],
  },
  {
    href: '/admin/audit-logs',
    label: 'Recent audit activity',
    shortLabel: 'Audit logs',
    icon: ScrollText,
  },
];

const isActiveHref = (
  pathname: string,
  href: string,
  activePatterns?: string[]
) => {
  if (activePatterns) {
    return activePatterns.some((pattern) => pathname.startsWith(pattern));
  }
  return pathname === href;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, router, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] font-bold text-white/70">
        Opening trust operations...
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
            Admin access is not enabled for this account. Talent and Recruiter
            accounts cannot enter moderation tools.
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
      <aside className="hidden border-r border-white/10 bg-[#07111f] p-5 text-white lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex items-start justify-between gap-3">
          <BrandLogo light />
          <NotificationBell dark />
        </div>
        <p className="mt-5 border-l-2 border-[#e7ad2d] pl-3 text-xs font-black uppercase text-white/45">
          Trust operations
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

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-[#cad7dd] bg-[#f7fbfc]/95 backdrop-blur lg:hidden">
          <div className="flex min-h-[72px] items-center justify-between gap-3 px-4">
            <Link
              href="/admin"
              aria-label="Nata Connect admin workspace"
              onClick={() => setMenuOpen(false)}
            >
              <BrandLogo />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-md border border-[#c8d6dc] bg-white text-[#07111f]"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
              >
                {menuOpen ? (
                  <X aria-hidden="true" size={20} />
                ) : (
                  <Menu aria-hidden="true" size={20} />
                )}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav
              className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-[#d5e0e4] bg-[#07111f] p-3 text-white shadow-xl"
              aria-label="Admin mobile navigation"
            >
              <p className="px-3 pb-3 text-[10px] font-black uppercase text-white/35">
                Trust operations
              </p>
              <div className="grid gap-4">
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
                            onClick={() => setMenuOpen(false)}
                            className={`grid min-h-12 grid-cols-[32px_1fr] items-center gap-3 rounded-md px-3 text-sm font-bold ${
                              active
                                ? 'bg-[#102438] text-[#55e6f7]'
                                : 'text-white/70'
                            }`}
                          >
                            <span className="flex size-8 items-center justify-center rounded-md bg-white/7 text-[#e7ad2d]">
                              <Icon aria-hidden="true" className="size-4" />
                            </span>
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mt-4 flex min-h-12 items-center rounded-md border border-white/12 px-3 text-sm font-bold text-[#ffd66d]"
              >
                Exit admin workspace
              </Link>
            </nav>
          )}
        </header>

        <main className="mx-auto min-w-0 max-w-[1440px] px-4 pb-28 pt-5 sm:px-8 sm:pt-7 lg:p-10">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#cad7dd] bg-white/96 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(7,17,31,0.12)] backdrop-blur lg:hidden"
          aria-label="Admin quick navigation"
        >
          {mobileAdminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActiveHref(
              pathname,
              link.href,
              link.activePatterns
            );
            return (
              <Link
                key={link.shortLabel}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] font-black ${
                  active ? 'bg-[#e9f8fb] text-[#008ca6]' : 'text-[#6d7e87]'
                }`}
              >
                <span className={active ? 'text-[#008ca6]' : 'text-[#9bacb4]'}>
                  <Icon aria-hidden="true" className="size-5" strokeWidth={2.4} />
                </span>
                <span className="max-w-full truncate px-1">{link.shortLabel}</span>
                {active && (
                  <span className="absolute top-1 h-1 w-6 rounded-full bg-[#e7ad2d]" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] font-black ${
              menuOpen ? 'bg-[#e9f8fb] text-[#008ca6]' : 'text-[#6d7e87]'
            }`}
            aria-expanded={menuOpen}
            aria-label="Open more admin navigation"
          >
            <MoreHorizontal
              aria-hidden="true"
              className={`size-5 ${menuOpen ? 'text-[#008ca6]' : 'text-[#9bacb4]'}`}
              strokeWidth={2.4}
            />
            <span>More</span>
            {menuOpen && (
              <span className="absolute top-1 h-1 w-6 rounded-full bg-[#e7ad2d]" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
