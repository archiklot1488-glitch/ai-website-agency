import { AdminLoginForm } from "@/components/admin-login-form";
import { BusinessForm } from "@/components/business-form";
import { BusinessList } from "@/components/business-list";
import { logoutAction } from "@/app/admin/actions";
import { getBusinesses } from "@/lib/businesses";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { businesses, error } = await getBusinesses();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Admin dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            AI Website Agency Automation
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Add local businesses and keep their intake details ready for future
            preview generation, client sharing, and payment unlocks.
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
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <BusinessForm />
        <section aria-labelledby="businesses-heading">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-stone-950"
                id="businesses-heading"
              >
                Businesses
              </h2>
              <p className="text-sm text-stone-600">
                {businesses.length} saved business
                {businesses.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : (
            <BusinessList businesses={businesses} />
          )}
        </section>
      </div>
    </main>
  );
}
