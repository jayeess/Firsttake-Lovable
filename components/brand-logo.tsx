import Image from 'next/image';

export function BrandLogo({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#020914] shadow-[0_0_24px_rgba(0,194,224,0.14)]">
        <Image
          src="/nata-connect-emblem.png"
          alt=""
          fill
          sizes="44px"
          className="object-cover"
          priority
        />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block whitespace-nowrap text-lg font-black">
            <span className="text-[#e7ad2d]">Nata</span>{' '}
            <span className="text-[#00c2e0]">Connect</span>
          </span>
          <span
            lang="te"
            className={`mt-1 block text-sm font-bold ${
              light ? 'text-white/65' : 'text-[#60717e]'
            }`}
          >
            నట కనెక్ట్
          </span>
        </span>
      )}
    </span>
  );
}
