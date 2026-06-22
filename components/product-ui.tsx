import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  children,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-md border border-[#cbd6db] bg-white shadow-sm">
      {/* Gold left accent — cinematic identity stripe */}
      <div className="absolute inset-y-0 left-0 w-1 bg-[#e7ad2d]" />
      {/* Subtle teal radial glow at top-right — cinematic depth */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(0,194,224,0.07),transparent_65%)]" />
      <div className="relative p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 max-w-4xl text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#657176]">
              {description}
            </p>
            {children}
          </div>
          {(actionHref || secondaryHref) && (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:justify-end">
              {secondaryHref && secondaryLabel && (
                <Link href={secondaryHref} className="secondary-button sm:w-auto">
                  {secondaryLabel}
                </Link>
              )}
              {actionHref && actionLabel && (
                <Link href={actionHref} className="primary-button sm:w-auto">
                  {actionLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'attention' | 'success' | 'danger';
}) {
  const accent =
    tone === 'danger'
      ? 'bg-red-500/70'
      : tone === 'attention'
        ? 'bg-[#e7ad2d]/80'
        : tone === 'success'
          ? 'bg-emerald-500/70'
          : 'bg-[#00c2e0]/70';
  return (
    <article className="surface relative overflow-hidden rounded-md p-4">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[#657176]">{label}</p>
          <p className="mt-1.5 text-2xl font-black sm:text-3xl">{value}</p>
        </div>
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#edf7f5] text-[#008ca6]">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        )}
      </div>
      {detail && (
        <p className="mt-2 text-xs font-semibold leading-5 text-[#657176]">
          {detail}
        </p>
      )}
    </article>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 text-2xl font-black leading-tight">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657176]">
            {description}
          </p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="secondary-button sm:w-auto">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SafetyNotice({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <aside className="rounded-md border border-[#bad7d3] bg-[#edf7f5] p-4 text-sm leading-6 text-[#234b47]">
      <div className="flex items-start gap-3">
        {Icon && <Icon aria-hidden="true" className="mt-0.5 size-5 text-[#008ca6]" />}
        <div>
          <p className="font-black text-[#123936]">{title}</p>
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </aside>
  );
}
