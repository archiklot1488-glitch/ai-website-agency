import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2 text-sm font-semibold">
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin"
      >
        Businesses
      </Link>
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin/lead-finder"
      >
        Lead Finder
      </Link>
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin/leads"
      >
        Leads / Deals
      </Link>
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin/outreach"
      >
        Outreach
      </Link>
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin/sdr"
      >
        SDR
      </Link>
      <Link
        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-800 transition hover:bg-stone-100"
        href="/admin/production"
      >
        Production
      </Link>
    </nav>
  );
}
