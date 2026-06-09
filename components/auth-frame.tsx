import Link from 'next/link';

export function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
      <section className="hidden min-h-screen bg-[#182126] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="text-2xl font-black">
          First<span className="text-[#ef6a57]">Take</span>
        </Link>
        <div>
          <p className="text-sm font-bold uppercase text-[#62b5ad]">
            Where talent meets opportunity
          </p>
          <blockquote className="mt-5 max-w-lg text-4xl font-bold leading-tight">
            Every memorable performance begins with one brave first take.
          </blockquote>
          <p className="mt-6 max-w-md leading-7 text-white/60">
            A focused workspace for artists building careers and casting teams
            finding the right person for the role.
          </p>
        </div>
        <p className="text-xs text-white/35">MVA Studios · FirstTake</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-lg">
          <Link href="/" className="mb-10 inline-block text-xl font-black lg:hidden">
            First<span className="text-[#ef6a57]">Take</span>
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight">{title}</h1>
          <p className="mt-3 max-w-md leading-7 text-[#657176]">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
