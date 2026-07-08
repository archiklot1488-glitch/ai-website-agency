import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { LeadDealCard } from "@/components/deals/lead-deal-card";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getLeadDeals } from "@/lib/deals";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { leads, error } = await getLeadDeals();
  const hotLeadCount = leads.filter((lead) => lead.isHot).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Leads / Deals
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Track interested clients, manual payment conversations, and launch
              websites after payment is confirmed.
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

      <section className="py-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              Pipeline
            </h2>
            <p className="text-sm text-stone-600">
              {leads.length} lead{leads.length === 1 ? "" : "s"} tracked
              {hotLeadCount > 0 ? `, ${hotLeadCount} hot` : ""}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-stone-950">
              No leads yet
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Live contact form submissions and future bot handoffs will appear
              here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {leads.map((lead) => (
              <LeadDealCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
