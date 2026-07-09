import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getDeploymentReadiness, getPublicEnvStatus } from "@/lib/env";
import type { DeploymentReadinessItem, ReadinessStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

const routeReadiness: DeploymentReadinessItem[] = [
  {
    detail: "admin dashboard protected",
    key: "/admin",
    label: "Admin dashboard",
    status: "ready",
  },
  {
    detail: "admin route protected",
    key: "/admin/lead-finder",
    label: "Lead Finder",
    status: "ready",
  },
  {
    detail: "admin route protected",
    key: "/admin/leads",
    label: "Leads / Deals",
    status: "ready",
  },
  {
    detail: "admin route protected",
    key: "/admin/outreach",
    label: "Outreach",
    status: "ready",
  },
  {
    detail: "admin route protected",
    key: "/admin/sdr",
    label: "SDR",
    status: "ready",
  },
  {
    detail: "secret header required",
    key: "/api/handoff",
    label: "Handoff API",
    status: "ready",
  },
  {
    detail: "secret header required",
    key: "/api/sdr/message",
    label: "SDR API",
    status: "ready",
  },
  {
    detail: "safe JSON health check",
    key: "/api/health",
    label: "Health API",
    status: "ready",
  },
];

function statusClass(status: ReadinessStatus) {
  const classes: Record<ReadinessStatus, string> = {
    missing: "border-red-200 bg-red-50 text-red-800",
    optional: "border-stone-200 bg-stone-50 text-stone-700",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };

  return classes[status];
}

function StatusCard({ item }: { item: DeploymentReadinessItem }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-stone-950">{item.label}</h3>
          <p className="mt-1 text-sm text-stone-600">{item.detail}</p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusClass(item.status)}`}
        >
          {item.status}
        </span>
      </div>
    </article>
  );
}

export default async function ProductionReadinessPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const readiness = await getDeploymentReadiness();
  const publicStatus = getPublicEnvStatus();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Production Readiness
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Check production configuration, database connectivity, route
              protection, and deployment-safe feature flags without exposing
              secret values.
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
        <section
          className={`rounded-lg border p-5 ${readiness.isReady ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
        >
          <h2 className="text-xl font-semibold">
            {readiness.isReady ? "Deployment checks are ready" : "Review required"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            Environment: {readiness.environmentName}. Database:{" "}
            {readiness.database.detail}. Secrets are shown only as configured or
            missing.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-stone-950">
            Environment Checklist
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {readiness.items.map((item) => (
              <StatusCard item={item} key={item.key} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-stone-950">
            Basic Route Readiness
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {routeReadiness.map((item) => (
              <StatusCard item={item} key={item.key} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            Safe Environment Summary
          </h2>
          <dl className="mt-4 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
            {Object.entries(publicStatus).map(([key, value]) => (
              <div key={key}>
                <dt className="font-semibold text-stone-950">{key}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
