import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Phase 1 foundation
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-stone-950 sm:text-5xl">
          AI Website Agency Automation
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-700">
          Create business records now, then extend the workflow into AI previews,
          client links, and paid website unlocks in later phases.
        </p>
        <Link
          className="mt-8 inline-flex items-center justify-center rounded-md bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          href="/admin"
        >
          Open admin
        </Link>
      </div>
    </main>
  );
}
