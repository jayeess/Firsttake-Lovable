'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/lib/auth-service';
import { useAuth } from '@/context/auth-context';

const talentLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/auditions', label: 'Browse auditions' },
  { href: '/applications', label: 'My applications' },
  { href: '/talent/profile', label: 'Profile' },
];

const recruiterLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/recruiter/auditions/new', label: 'Post audition' },
  { href: '/recruiter/auditions', label: 'My auditions' },
  { href: '/recruiter/profile', label: 'Company profile' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userType } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = userType === 'RECRUITER' ? recruiterLinks : talentLinks;

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#20252b]">
      <header className="sticky top-0 z-20 border-b border-[#d9dee5] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold text-[#1f5f91]">
            FirstTake
          </Link>
          <button
            type="button"
            className="h-11 px-3 text-sm font-semibold md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            Menu
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium ${
                  pathname === link.href
                    ? 'text-[#1f5f91]'
                    : 'text-[#505861] hover:text-[#1f5f91]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-3 h-10 border border-[#cbd2da] px-4 text-sm font-semibold hover:bg-[#f4f6f8]"
            >
              Log out
            </button>
          </nav>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#e2e6eb] bg-white px-4 py-3 md:hidden">
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
              className="min-h-11 py-3 text-sm font-semibold text-red-600"
            >
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
