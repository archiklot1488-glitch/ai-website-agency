import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getOutreachDashboardData } from "@/lib/outreach";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function label(value: string | null | undefined) {
  return (value || "not_set").replaceAll("_", " ");
}

export default async function AdminOutreachPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { error, leads, websites } = await getOutreachDashboardData();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Outreach Assistant
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Prepare manual messages, track copy/sent status, and capture
              replies without connecting email or SMS.
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

      <div className="py-8">
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Messages are suggestions and must be reviewed before sending. Use
          accurate sender identity, avoid deceptive subject lines, include an
          opt-out line for cold email, and respect applicable email/SMS laws and
          platform rules.
        </section>

        {error ? (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  Websites Ready To Contact
                </h2>
                <p className="text-sm text-stone-600">
                  {websites.length} recent preview or live website
                  {websites.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {websites.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
                  <h3 className="text-base font-semibold text-stone-950">
                    No websites ready
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    Generate a preview website before preparing outreach.
                  </p>
                </div>
              ) : (
                websites.map(({ business, latestMessage, website }) => (
                  <article
                    className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                    key={website.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-950">
                          {business?.business_name || website.slug}
                        </h3>
                        <p className="mt-1 text-sm text-stone-600">
                          Website: {website.slug} · Site status: {website.status} ·
                          Outreach: {label(website.outreach_status)}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          Latest message: {label(latestMessage?.status)} ·{" "}
                          {formatDate(latestMessage?.updated_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href="/admin"
                        >
                          Business
                        </Link>
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/preview/${website.slug}?token=${website.preview_token}`}
                          target="_blank"
                        >
                          Preview
                        </Link>
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/websites/${website.id}/offer`}
                        >
                          Offer
                        </Link>
                        <Link
                          className="rounded bg-emerald-700 px-2 py-1 font-semibold text-white underline-offset-4 hover:underline"
                          href={`/admin/websites/${website.id}/outreach`}
                        >
                          Outreach
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-950">
                Leads Needing Follow-Up
              </h2>
              <p className="text-sm text-stone-600">
                Manual replies and active deals to keep moving
              </p>
            </div>

            <div className="grid gap-4">
              {leads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
                  <h3 className="text-base font-semibold text-stone-950">
                    No active follow-up
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    Hot replies will appear here after they are logged.
                  </p>
                </div>
              ) : (
                leads.map((lead) => (
                  <article
                    className={
                      lead.isHot
                        ? "rounded-lg border-2 border-amber-400 bg-amber-50 p-5 shadow-sm"
                        : "rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                    }
                    key={lead.id}
                  >
                    <h3 className="text-base font-semibold text-stone-950">
                      {lead.name || "Unnamed lead"}
                    </h3>
                    <p className="mt-1 text-sm text-stone-700">
                      {lead.email || lead.phone || "No contact set"}
                    </p>
                    <p className="mt-2 text-sm text-stone-600">
                      Status: {label(lead.status)} · Priority:{" "}
                      {label(lead.priority)} · Source: {label(lead.source)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <Link
                        className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                        href={`/admin/leads#lead-${lead.id}`}
                      >
                        Lead / Deal
                      </Link>
                      {lead.website ? (
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/websites/${lead.website.id}/outreach`}
                        >
                          Outreach
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
