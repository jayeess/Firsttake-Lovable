'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/lib/auth-service';
import { useAuth } from '@/context/auth-context';

const talentLinks = [
  { href: '/dashboard', label: 'Overview', mark: '01' },
  { href: '/auditions', label: 'Discover roles', mark: '02' },
  { href: '/applications', label: 'Applications', mark: '03' },
  { href: '/talent/profile', label: 'My portfolio', mark: '04' },
];

const recruiterLinks = [
  { href: '/dashboard', label: 'Overview', mark: '01' },
  { href: '/recruiter/auditions/new', label: 'Create audition', mark: '02' },
  { href: '/recruiter/auditions', label: 'Casting calls', mark: '03' },
  { href: '/recruiter/profile', label: 'Company profile', mark: '04' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userType } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = userType === 'RECRUITER' ? recruiterLinks : talentLinks;

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#182126] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden min-h-screen border-r border-[#263237] bg-[#182126] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-white/10 px-7 py-7">
          <Link href="/dashboard" className="text-2xl font-black">
            First<span className="text-[#ef6a57]">Take</span>
          </Link>
          <p className="mt-2 text-xs uppercase text-white/45">
            Casting workspace
          </p>
        </div>
        <nav className="flex-1 px-3 py-6">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mb-1 flex min-h-12 items-center gap-4 px-4 text-sm font-semibold ${
                  active
                    ? 'bg-white text-[#182126]'
                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className={`text-[10px] ${active ? 'text-[#0d766e]' : 'text-white/35'}`}>
                  {link.mark}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-5">
          <p className="truncate text-sm font-semibold">{user?.email}</p>
          <p className="mt-1 text-xs text-white/45">
            {userType === 'RECRUITER' ? 'Recruiter account' : 'Talent account'}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 min-h-11 w-full border border-white/20 text-sm font-semibold hover:bg-white hover:text-[#182126]"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#dfe3e1] bg-[#f7f6f2]/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="text-xl font-black">
              First<span className="text-[#ef6a57]">Take</span>
            </Link>
            <button
              type="button"
              className="min-h-11 px-3 text-sm font-bold"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
          {menuOpen && (
            <nav className="border-t border-[#dfe3e1] bg-white px-4 py-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block min-h-11 py-3 text-sm font-semibold"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 py-3 text-sm font-semibold text-[#d95242]"
              >
                Log out
              </button>
            </nav>
          )}
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
