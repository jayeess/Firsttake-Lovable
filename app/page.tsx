import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#20252b]">
      <header className="border-b border-[#e1e5ea]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <span className="text-xl font-bold text-[#1f5f91]">FirstTake</span>
          <nav className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-semibold text-[#1f5f91]"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-[#2e75b6] px-4 py-2 text-sm font-semibold text-white"
            >
              Join FirstTake
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#eef4f8]">
        <div className="mx-auto grid min-h-[68vh] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold uppercase text-[#2e75b6]">
              Where talent meets opportunity
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight text-[#26323d] sm:text-6xl">
              One professional home for casting and talent discovery.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#59636d]">
              Build your portfolio, discover legitimate auditions, manage
              applicants, and track every application in one transparent
              workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/signup"
                className="bg-[#2e75b6] px-6 py-3 font-semibold text-white hover:bg-[#245f95]"
              >
                Create an account
              </Link>
              <Link
                href="/auth/login"
                className="border border-[#9ba7b2] bg-white px-6 py-3 font-semibold"
              >
                I already have an account
              </Link>
            </div>
          </div>
          <div className="border-l-4 border-[#2e75b6] bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">Built for both sides of casting</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-bold text-[#1f5f91]">For talent</h3>
                <p className="mt-2 text-sm leading-6 text-[#5d6670]">
                  Create a professional profile, browse roles, apply quickly,
                  and follow each status update.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#1f5f91]">For recruiters</h3>
                <p className="mt-2 text-sm leading-6 text-[#5d6670]">
                  Publish structured auditions, review candidates, and manage
                  shortlists without scattered messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3">
        {[
          ['Verified opportunities', 'Structured recruiter profiles and clear audition details build trust.'],
          ['Professional portfolios', 'Talent can present experience, media, location, and social links in one place.'],
          ['Transparent tracking', 'Applications move through applied, viewed, shortlisted, and rejected states.'],
        ].map(([title, body]) => (
          <article key={title} className="border-t-2 border-[#2e75b6] pt-5">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-3 leading-7 text-[#606a74]">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
