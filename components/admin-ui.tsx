import Link from 'next/link';
import type { ReactNode } from 'react';

export type AdminStatusTone =
  | 'neutral'
  | 'attention'
  | 'success'
  | 'danger'
  | 'muted';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#657176] sm:text-base sm:leading-7">
            {description}
          </p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="primary-button lg:w-auto">
          {actionLabel}
        </Link>
      )}
    </header>
  );
}

export function AdminMetricCard({
  label,
  value,
  detail,
  tone = 'neutral',
  href,
}: {
  label: string;
  value: number | string;
  detail?: string;
  tone?: 'neutral' | 'attention' | 'success' | 'danger';
  href?: string;
}) {
  const accent =
    tone === 'danger'
      ? 'bg-red-500'
      : tone === 'attention'
        ? 'bg-[#e7ad2d]'
        : tone === 'success'
          ? 'bg-emerald-500'
          : 'bg-[#00c2e0]';
  const content = (
    <article className="surface relative h-full overflow-hidden rounded-md p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <p className="text-sm font-bold text-[#657176]">{label}</p>
      <p className="mt-3 text-3xl font-black sm:text-4xl">{value}</p>
      {detail && <p className="mt-2 text-xs font-bold uppercase text-[#8a9697]">{detail}</p>}
    </article>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-95">
      {content}
    </Link>
  ) : (
    content
  );
}

export function AdminStatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: AdminStatusTone;
}) {
  const styles =
    tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'attention'
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : tone === 'muted'
            ? 'border-[#d3dde2] bg-[#f4f7f8] text-[#657176]'
            : 'border-[#b9d8df] bg-[#effafd] text-[#006d82]';
  return (
    <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 text-[10px] font-black uppercase ${styles}`}>
      {children}
    </span>
  );
}

export function AdminActionGroup({
  title = 'Review actions',
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-[#d8e2e6] bg-[#f8fbfc] p-3">
      <p className="mb-2 text-[10px] font-black uppercase text-[#657176]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function AdminDangerActionGroup({
  title = 'Enforcement actions',
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50/55 p-3">
      <p className="mb-2 text-[10px] font-black uppercase text-red-800">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export function AdminInfo({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-[#7c8990]">{label}</dt>
      <dd className="mt-1 break-words font-bold">{value || 'Not available'}</dd>
    </div>
  );
}

export function AdminEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="surface mt-6 rounded-md border-dashed p-8 text-center">
      <p className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#edf7f5] text-lg font-black text-[#008ca6]">
        OK
      </p>
      <h2 className="mt-4 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-[#657176]">{message}</p>
    </section>
  );
}
