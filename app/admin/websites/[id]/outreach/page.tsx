import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { InboundReplyForm } from "@/components/outreach/inbound-reply-form";
import { OutreachMessageComposer } from "@/components/outreach/outreach-message-composer";
import { WebsiteErrorPage } from "@/components/website/website-error-page";
import { logoutAction } from "@/app/admin/actions";
import { startWebsiteSDRConversationAction } from "@/app/admin/websites/[id]/outreach/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { generateOutreachDrafts } from "@/lib/outreach-message-generator";
import { getWebsiteOutreachWorkspace } from "@/lib/outreach";
import type { OutreachDraft } from "@/lib/outreach-message-generator";
import type { OutreachMessage } from "@/types/database";

type WebsiteOutreachPageProps = {
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

function label(value: string | null | undefined) {
  return (value || "not_set").replaceAll("_", " ");
}

function findMessageForDraft(
  draft: OutreachDraft,
  messages: OutreachMessage[],
) {
  return (
    messages.find((message) => {
      if (message.direction !== "outbound") {
        return false;
      }

      if (message.message_type !== draft.messageType) {
        return false;
      }

      if (draft.messageType === "objection_response") {
        return message.subject === draft.subject;
      }

      return true;
    }) ?? null
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function WebsiteOutreachPage({
  params,
}: WebsiteOutreachPageProps) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { id } = await params;
  const result = await getWebsiteOutreachWorkspace(id);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "invalid") {
    return <WebsiteErrorPage message={result.message} />;
  }

  const requestHeaders = await headers();
  const previewHref = `/preview/${result.website.slug}?token=${result.website.preview_token}`;
  const previewUrl = `${requestOrigin(requestHeaders)}${previewHref}`;
  const drafts = generateOutreachDrafts({
    business: result.business,
    previewUrl,
    website: result.website,
  });
  const linkedLead = result.leads[0] ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              Website Outreach
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Manual message drafting and reply tracking for{" "}
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

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Messages are suggestions and must be reviewed before sending. Use
            accurate sender identity, do not use deceptive subject lines, include
            an opt-out line when using cold email, and respect applicable laws
            and platform rules.
          </section>

          {drafts.map((draft) => (
            <OutreachMessageComposer
              businessId={result.business?.id ?? null}
              draft={draft}
              existingMessage={findMessageForDraft(draft, result.messages)}
              key={draft.key}
              leadId={linkedLead?.id ?? null}
              websiteId={result.website.id}
            />
          ))}

          <InboundReplyForm
            businessId={result.business?.id ?? null}
            leadId={linkedLead?.id ?? null}
            websiteId={result.website.id}
          />
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">Context</h2>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p>
                <span className="font-semibold text-stone-950">Business:</span>{" "}
                {result.business?.business_name ||
                  result.website.website_json.brand.businessName}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Niche:</span>{" "}
                {result.business?.business_type || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">City:</span>{" "}
                {result.business?.city || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Website:</span>{" "}
                {result.website.slug}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Offer status:</span>{" "}
                {label(result.website.outreach_status)}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Preview sent:</span>{" "}
                {formatDate(result.website.preview_sent_at)}
              </p>
              {linkedLead ? (
                <p>
                  <span className="font-semibold text-stone-950">Lead:</span>{" "}
                  {label(linkedLead.status)} · {label(linkedLead.priority)}
                </p>
              ) : (
                <p>
                  <span className="font-semibold text-stone-950">Lead:</span> Not
                  linked yet
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <form action={startWebsiteSDRConversationAction}>
                <input name="website_id" type="hidden" value={result.website.id} />
                <button
                  className="rounded bg-stone-950 px-2 py-1 font-semibold text-white underline-offset-4 hover:underline"
                  type="submit"
                >
                  Open SDR Conversation
                </button>
              </form>
              <Link
                className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                href="/admin/outreach"
              >
                Outreach
              </Link>
              <Link
                className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                href={previewHref}
                target="_blank"
              >
                Preview
              </Link>
              <Link
                className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                href={`/admin/websites/${result.website.id}/offer`}
              >
                Offer
              </Link>
              {linkedLead ? (
                <Link
                  className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                  href={`/admin/leads#lead-${linkedLead.id}`}
                >
                  Lead / Deal
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">
              Message History
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {result.messages.length === 0 ? (
                <p className="text-stone-600">No outreach messages saved yet.</p>
              ) : (
                result.messages.slice(0, 12).map((message) => (
                  <div
                    className="rounded-md border border-stone-200 bg-stone-50 p-3"
                    key={message.id}
                  >
                    <p className="font-semibold text-stone-950">
                      {label(message.message_type)} · {label(message.status)}
                    </p>
                    <p className="mt-1 text-stone-600">
                      {label(message.direction)} · {formatDate(message.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
