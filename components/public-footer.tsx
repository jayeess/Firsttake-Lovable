import Link from 'next/link';

const policyLinks = [
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
  ['/community-guidelines', 'Community Guidelines'],
  ['/safety', 'Safety'],
  ['/help', 'Help'],
  ['/contact', 'Contact'],
  ['/beta-feedback', 'Beta Feedback'],
] as const;

export function PublicFooter({ dark = false }: { dark?: boolean }) {
  return (
    <footer
      className={`px-5 py-8 text-sm ${
        dark ? 'bg-[#07111f] text-white/68' : 'text-[#657176]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-current/15 pt-6 md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">
          Built for trusted casting, safer communication, and professional
          talent discovery.
        </p>
        <nav
          aria-label="Public support and policy links"
          className="flex flex-wrap gap-x-4 gap-y-2 font-bold"
        >
          {policyLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={dark ? 'hover:text-white' : 'hover:text-[#008ca6]'}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
