import Link from 'next/link';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div
      className="mt-6 flex items-center gap-3 rounded-md border border-[#cbd8dd] bg-white p-5 text-sm font-bold text-[#657176] sm:p-6"
      role="status"
    >
      <span className="size-2.5 shrink-0 rounded-full bg-[#00c2e0] shadow-[0_0_0_6px_rgba(0,194,224,0.12)]" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  secondaryHref,
  secondaryLabel,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div
      className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-5 text-amber-950 sm:p-6"
      role="alert"
    >
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
      {(onRetry || (secondaryHref && secondaryLabel)) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="secondary-button min-h-10 px-4 text-sm"
            >
              Try again
            </button>
          )}
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className="secondary-button min-h-10 px-4 text-sm">
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="surface mt-6 border-dashed p-7 text-center sm:p-10">
      <p className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-[#edf7f5] text-lg font-black text-[#008ca6]">
        NC
      </p>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-[#657176]">{message}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="primary-button mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
