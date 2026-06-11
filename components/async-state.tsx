import Link from 'next/link';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div
      className="mt-6 border border-[#cbd8dd] bg-white p-6 text-sm font-bold text-[#657176]"
      role="status"
    >
      {label}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="mt-6 border border-amber-300 bg-amber-50 p-5 text-amber-950"
      role="alert"
    >
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="secondary-button mt-4 min-h-10 px-4 text-sm"
        >
          Try again
        </button>
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
    <div className="surface mt-6 border-dashed p-10 text-center">
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
