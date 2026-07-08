import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { WebsiteOfferForm } from "@/components/website-offer/website-offer-form";
import { WebsiteErrorPage } from "@/components/website/website-error-page";
import { logoutAction } from "@/app/admin/actions";
import {
  generateClientPreviewMessage,
  generateFollowUpMessage,
} from "@/lib/offer-messages";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getWebsiteForAdminEdit } from "@/lib/websites";

type WebsiteOfferPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

function requestOrigin(requestHeaders: Headers) {
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export default async function WebsiteOfferPage({ params }: WebsiteOfferPageProps) {
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

  const requestHeaders = await headers();
  const previewHref = `/preview/${result.website.slug}?token=${result.website.preview_token}`;
  const previewUrl = `${requestOrigin(requestHeaders)}${previewHref}`;
  const liveHref =
    result.website.status === "live" ? `/site/${result.website.slug}` : null;
  const messageInput = {
    business: result.business ?? null,
    previewUrl,
    website: result.website,
  };
  const clientMessage =
    result.website.client_message?.trim() ||
    generateClientPreviewMessage(messageInput);
  const followUpMessage =
    result.website.follow_up_message?.trim() ||
    generateFollowUpMessage(messageInput);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Offer Package
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Prepare the manual client-facing message for{" "}
              {result.business?.business_name ||
                result.website.website_json.brand.businessName}
              .
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
        <WebsiteOfferForm
          business={result.business ?? null}
          clientMessage={clientMessage}
          followUpMessage={followUpMessage}
          liveHref={liveHref}
          previewHref={previewHref}
          previewUrl={previewUrl}
          website={result.website}
        />
      </div>
    </main>
  );
}
