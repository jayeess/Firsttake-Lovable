import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-[#f7f6f2] text-[#182126]">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 text-white">
          <span className="text-2xl font-black">
            First<span className="text-[#ef6a57]">Take</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/auth/login" className="min-h-11 px-4 py-3 text-sm font-bold">
              Log in
            </Link>
            <Link href="/auth/signup" className="bg-white px-4 py-3 text-sm font-bold text-[#182126]">
              Join the platform
            </Link>
          </nav>
        </div>
      </header>

      <section
        className="relative flex min-h-[88vh] items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/firsttake-casting-hero.png')" }}
      >
        <div className="absolute inset-0 bg-[#10191d]/70" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-28 text-white">
          <p className="text-sm font-bold uppercase text-[#7fd0c7]">
            The casting network built for serious work
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">
            Find the role.
            <br />
            Find the person.
            <br />
            Make the first take count.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/75">
            FirstTake gives emerging talent and verified casting teams one
            professional place to discover, apply, review, and move forward.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/auth/signup" className="primary-button px-7">
              Start your profile
            </Link>
            <Link href="/auth/login" className="min-h-12 border border-white/45 px-7 py-3 font-bold hover:bg-white hover:text-[#182126]">
              Open workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-0 px-5 py-16 lg:grid-cols-3">
        {[
          ['01', 'Real opportunities', 'Structured casting calls with deadlines, role requirements, and transparent status.'],
          ['02', 'Profiles that perform', 'A polished portfolio for talent and a credible company presence for recruiters.'],
          ['03', 'One clear workflow', 'Move from discovery to application and shortlist without scattered messages.'],
        ].map(([number, title, body]) => (
          <article key={number} className="border-t border-[#bdc7c5] py-7 lg:border-l lg:border-t-0 lg:px-8 first:lg:border-l-0">
            <p className="text-xs font-bold text-[#0d766e]">{number}</p>
            <h2 className="mt-4 text-2xl font-black">{title}</h2>
            <p className="mt-3 max-w-sm leading-7 text-[#5f6c70]">{body}</p>
          </article>
        ))}
      </section>

      <section className="bg-[#182126] px-5 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#62b5ad]">Built for the work</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black">
              Less noise. Better profiles. Faster casting decisions.
            </h2>
          </div>
          <Link href="/auth/signup" className="primary-button shrink-0">
            Create free account
          </Link>
        </div>
      </section>
    </main>
  );
}
