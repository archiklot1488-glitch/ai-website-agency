import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { SDRConversationActions } from "@/components/sdr/sdr-conversation-actions";
import { SDRInboundMessageForm } from "@/components/sdr/sdr-inbound-message-form";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getSDRConversationDetail } from "@/lib/sdr/conversations";

type SDRConversationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
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

export default async function SDRConversationPage({
  params,
}: SDRConversationPageProps) {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { id } = await params;
  const result = await getSDRConversationDetail(id);

  if (result.status === "not-found") {
    notFound();
  }

  const latestAnalyzed = [...result.messages]
    .reverse()
    .find((message) => message.suggested_reply);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              SDR Conversation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Suggested replies are drafts. Review before sending, do not
              misrepresent identity, respect opt-out requests, and stop
              messaging when a client says no.
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
            This page only drafts suggestions. It does not send messages. Admin
            review is required before any reply is used.
          </section>

          <SDRInboundMessageForm conversation={result.conversation} />

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-950">
              Suggested Reply
            </h2>
            {latestAnalyzed?.suggested_reply ? (
              <p className="mt-4 whitespace-pre-wrap rounded-md border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-800">
                {latestAnalyzed.suggested_reply}
              </p>
            ) : (
              <p className="mt-3 text-sm text-stone-600">
                Add an inbound message to generate a suggestion.
              </p>
            )}
          </section>

          <SDRConversationActions
            conversationId={result.conversation.id}
            suggestedReply={latestAnalyzed?.suggested_reply ?? null}
          />

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-950">
              Message History
            </h2>
            <div className="mt-5 space-y-4">
              {result.messages.length === 0 ? (
                <p className="text-sm text-stone-600">No messages yet.</p>
              ) : (
                result.messages.map((message) => (
                  <article
                    className="rounded-md border border-stone-200 bg-stone-50 p-4"
                    key={message.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-stone-950">
                        {label(message.direction)} · {label(message.sender_role)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-800">
                      {message.body}
                    </p>
                    {message.detected_intent ? (
                      <p className="mt-3 text-sm text-stone-600">
                        Intent: {label(message.detected_intent)}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">Details</h2>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p>
                <span className="font-semibold text-stone-950">Status:</span>{" "}
                {label(result.conversation.status)}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Intent:</span>{" "}
                {label(result.conversation.detected_intent)}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Handoff:</span>{" "}
                {result.conversation.handoff_required ? "yes" : "no"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Channel:</span>{" "}
                {label(result.conversation.channel)}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Client:</span>{" "}
                {result.conversation.client_name || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Email:</span>{" "}
                {result.conversation.client_email || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Phone:</span>{" "}
                {result.conversation.client_phone || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Summary:</span>{" "}
                {result.conversation.conversation_summary || "Not set"}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link
                className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                href="/admin/sdr"
              >
                SDR
              </Link>
              {result.lead ? (
                <Link
                  className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                  href={`/admin/leads#lead-${result.lead.id}`}
                >
                  Lead / Deal
                </Link>
              ) : null}
              {result.website ? (
                <Link
                  className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                  href={`/admin/websites/${result.website.id}/outreach`}
                >
                  Outreach
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">Links</h2>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p>Business: {result.business?.business_name || "Not linked"}</p>
              <p>Website: {result.website?.slug || "Not linked"}</p>
              <p>Lead: {result.lead?.status ? label(result.lead.status) : "Not linked"}</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
