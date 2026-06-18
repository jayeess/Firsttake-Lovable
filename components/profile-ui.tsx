import Link from 'next/link';
import type { ReactNode } from 'react';

export function ProfileHero({
  eyebrow,
  title,
  description,
  meta,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden rounded-md border border-[#cbd6db] bg-[#07111f] p-5 text-white shadow-sm sm:p-7">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(0,194,224,0.24),transparent_62%)]" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-[#7fd0c7]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
            {description}
          </p>
          {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            {primaryAction}
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className="secondary-button border-white/25 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
              >
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProfileStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'success' | 'attention';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'attention'
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : 'border-white/15 bg-white/10 text-white';
  return (
    <span className={`rounded-md border px-3 py-2 text-xs font-black uppercase ${toneClass}`}>
      {label}: {value}
    </span>
  );
}

export function ProfileSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#d7e2e6] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-black sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#657176]">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function ReadinessChecklist({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; complete: boolean; hint?: string }>;
}) {
  return (
    <section className="rounded-md border border-[#d7e2e6] bg-white p-4 shadow-sm sm:p-5">
      <p className="eyebrow">Readiness checklist</p>
      <h2 className="mt-2 text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-md border border-[#e0e8eb] bg-[#f8fbfc] p-3"
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                item.complete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {item.complete ? 'OK' : '!'}
            </span>
            <div>
              <p className="text-sm font-black">{item.label}</p>
              {item.hint && (
                <p className="mt-1 text-xs leading-5 text-[#657176]">
                  {item.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PrivacyNote({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-[#bad7d3] bg-[#edf7f5] p-4 text-sm leading-6 text-[#234b47] ${className}`}>
      <p className="font-black text-[#07111f]">{title}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}
