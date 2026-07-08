import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { LeadResults } from "@/components/lead-finder/lead-results";
import { LeadSearchForm } from "@/components/lead-finder/lead-search-form";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getLeadSearchWithCandidates } from "@/lib/lead-finder/searches";

type LeadFinderPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    imported?: string | string[];
    import_error?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadFinderPage({
  searchParams,
}: LeadFinderPageProps) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const query = await searchParams;
  const searchId = firstValue(query.search);
  const leadSearch = searchId
    ? await getLeadSearchWithCandidates(searchId)
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Lead Finder
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Search local businesses, score lead quality, and import selected
              candidates for manual website generation.
            </p>
          </div>

          <form action={logoutAction}>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>

        <AdminNav />
      </header>

      <div className="grid gap-8 py-8">
        <LeadSearchForm />
        <LeadResults
          importError={firstValue(query.import_error)}
          importedBusinessId={firstValue(query.imported)}
          leadSearch={leadSearch}
        />
      </div>
    </main>
  );
}
