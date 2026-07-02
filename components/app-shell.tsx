'use client';

import Link from 'next/link';
import {
  BriefcaseBusiness,
  Bookmark,
  ClipboardList,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/app/lib/auth-service';
import { useAuth } from '@/context/auth-context';
import type { UserType } from '@/app/lib/types';
import { BrandLogo } from '@/components/brand-logo';
import { NotificationBell } from '@/components/notification-bell';

type NavLink = {
  href: string;
  label: string;
  shortLabel: string;
  mark: string;
  icon: LucideIcon;
  activePattern?: string;
  exact?: boolean;
};

const talentLinks: NavLink[] = [
  { href: '/dashboard', label: 'Workspace', shortLabel: 'Home', mark: '01', icon: Home },
  { href: '/auditions', label: 'Find auditions', shortLabel: 'Auditions', mark: '02', icon: Search },
  { href: '/applications', label: 'My applications', shortLabel: 'Applications', mark: '03', icon: ClipboardList },
  { href: '/messages', label: 'Messages', shortLabel: 'Messages', mark: '04', icon: MessageSquare },
  { href: '/talent/profile', label: 'Talent profile', shortLabel: 'Profile', mark: '05', icon: UserRound },
];

const recruiterLinks: NavLink[] = [
  { href: '/dashboard', label: 'Workspace', shortLabel: 'Dashboard', mark: '01', icon: LayoutDashboard },
  { href: '/recruiter/auditions', label: 'Casting calls', shortLabel: 'Auditions', mark: '02', icon: BriefcaseBusiness, exact: true },
  { href: '/recruiter/auditions', label: 'Applicants', shortLabel: 'Applicants', mark: '03', icon: UsersRound, activePattern: '/recruiter/auditions/' },
  { href: '/recruiter/talent-pool', label: 'Talent Pool', shortLabel: 'Pool', mark: '04', icon: Bookmark },
  { href: '/messages', label: 'Messages', shortLabel: 'Messages', mark: '05', icon: MessageSquare },
  { href: '/recruiter/profile', label: 'Company profile', shortLabel: 'Profile', mark: '06', icon: UserRound },
  { href: '/recruiter/auditions/new', label: 'Post an audition', shortLabel: 'Post', mark: '07', icon: PlusCircle },
  { href: '/recruiter/verification', label: 'Verification', shortLabel: 'Verify', mark: '08', icon: ShieldCheck },
];

const mobileRecruiterLinks = recruiterLinks.slice(0, 5);

const isActiveLink = (pathname: string, link: NavLink) => {
  if (link.activePattern) return pathname.startsWith(link.activePattern);
  if (link.exact) return pathname === link.href;
  return pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
};

export function AppShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Extract<UserType, 'TALENT' | 'RECRUITER'>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userType, loading, accountStatus } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = userType === 'RECRUITER' ? recruiterLinks : talentLinks;
  const mobileLinks = userType === 'RECRUITER' ? mobileRecruiterLinks : talentLinks;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }

    if (!loading && requiredRole && userType && userType !== requiredRole) {
      router.replace('/dashboard');
    }
  }, [loading, requiredRole, router, user, userType]);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] font-bold text-white/70">
        Preparing Nata Connect...
      </main>
    );
  }

  if (!user || !userType || (requiredRole && userType !== requiredRole)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef4f7] p-6">
        <div className="surface max-w-md p-7 text-center">
          <p className="eyebrow">
            {!userType && user ? 'Account setup required' : 'Checking access'}
          </p>
          <h1 className="mt-3 text-2xl font-black">
            {!userType && user
              ? 'This account does not have a valid role yet'
              : 'Opening the right workspace'}
          </h1>
        </div>
      </main>
    );
  }

  if (accountStatus === 'SUSPENDED') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef4f7] p-6">
        <section className="surface max-w-lg p-8 text-center">
          <p className="eyebrow">Account restricted</p>
          <h1 className="mt-3 text-3xl font-black">This account is suspended</h1>
          <p className="mt-3 leading-7 text-[#657176]">
            Sensitive actions are unavailable while the trust and safety team
            reviews this account.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <button type="button" onClick={handleLogout} className="primary-button w-full sm:w-auto">
              Log out
            </button>
            <Link
              href="/help"
              className="text-sm font-bold text-[#008ca6] underline-offset-2 hover:underline"
            >
              Contact support
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef4f7] text-[#07111f] lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/8 bg-[#07111f] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-white/8 px-6 py-6">
          <Link href="/dashboard" aria-label="Nata Connect workspace">
            <BrandLogo light />
          </Link>
          <p className="mt-4 border-l-2 border-[#e7ad2d] pl-3 text-[11px] font-bold uppercase text-white/45">
            Talent and casting network
          </p>
        </div>

        <nav className="flex-1 px-3 py-5" aria-label="Workspace navigation">
          <p className="px-4 pb-3 text-[10px] font-black uppercase text-white/30">
            {userType === 'RECRUITER' ? 'Recruiter tools' : 'Talent tools'}
          </p>
          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(pathname, link);
              return (
                <Link
                  key={`${link.href}-${link.shortLabel}`}
                  href={link.href}
                  className={`group grid min-h-12 grid-cols-[32px_1fr_16px] items-center gap-2 rounded-md px-3 text-sm font-bold ${
                    active
                      ? 'bg-[#102438] text-white shadow-[inset_3px_0_0_#00c2e0]'
                      : 'text-white/58 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded border text-[10px] ${
                      active
                        ? 'border-[#00c2e0]/50 bg-[#00c2e0]/10 text-[#55e6f7]'
                        : 'border-white/10 text-white/30'
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                  </span>
                  <span>{link.label}</span>
                  <span className={active ? 'text-[#e7ad2d]' : 'text-white/15'}>
                    &gt;
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase text-white/35">Activity</p>
            <NotificationBell dark />
          </div>
          <div className="rounded-md bg-white/5 p-3">
            <p className="truncate text-sm font-bold">{user.email}</p>
            <p className="mt-1 text-xs text-white/42">
              {userType === 'RECRUITER' ? 'Recruiter account' : 'Talent account'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 min-h-11 w-full rounded-md border border-white/12 text-sm font-bold text-white/70 hover:border-[#e7ad2d]/60 hover:text-[#ffd66d]"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#cad7dd] bg-[#f7fbfc]/95 backdrop-blur lg:hidden">
          <div className="flex h-[72px] items-center justify-between px-4">
            <Link href="/dashboard">
              <BrandLogo />
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-md border border-[#c8d6dc] bg-white text-[#07111f]"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="border-t border-[#d5e0e4] bg-[#07111f] p-3 text-white">
              <div className="grid gap-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const active = isActiveLink(pathname, link);
                  return (
                    <Link
                      key={`${link.href}-${link.shortLabel}`}
                      href={link.href}
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
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 min-h-12 w-full rounded-md border border-white/12 text-sm font-bold text-[#ffd66d]"
              >
                Log out
              </button>
            </nav>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pt-6 lg:px-10 lg:py-9">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[#cad7dd] bg-white/96 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(7,17,31,0.12)] backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}>
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const active = isActiveLink(pathname, link);
            return (
              <Link
                key={`${link.href}-${link.shortLabel}`}
                href={link.href}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-black ${
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
        </nav>
      </div>
    </div>
  );
}
