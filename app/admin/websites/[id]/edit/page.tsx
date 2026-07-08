import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { WebsiteEditorForm } from "@/components/website-editor/website-editor-form";
import { WebsiteErrorPage } from "@/components/website/website-error-page";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getWebsiteForAdminEdit } from "@/lib/websites";

type WebsiteEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function WebsiteEditorPage({
  params,
}: WebsiteEditorPageProps) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { id } = await params;
  const result = await getWebsiteForAdminEdit(id);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "invalid") {
    return <WebsiteErrorPage message={result.message} />;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Edit Website
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              {result.business
                ? `Editing ${result.business.business_name}`
                : "Editing generated website content"}
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
        <WebsiteEditorForm website={result.website} />
      </div>
    </main>
  );
}
