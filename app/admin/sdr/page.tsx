import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminNav } from "@/components/admin-nav";
import { StartSDRConversationForm } from "@/components/sdr/start-sdr-conversation-form";
import { logoutAction } from "@/app/admin/actions";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { getSDRConversations } from "@/lib/sdr/conversations";

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

export default async function AdminSDRPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <AdminLoginForm isConfigured={isAdminConfigured()} />
      </main>
    );
  }

  const { conversations, error } = await getSDRConversations();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950">
              AI SDR
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Analyze client replies, draft manual responses, and create hot
              handoff leads without sending anything automatically.
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

      <div className="grid gap-8 py-8 lg:grid-cols-[420px_1fr]">
        <StartSDRConversationForm />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-stone-950">
              Recent Conversations
            </h2>
            <p className="text-sm text-stone-600">
              {conversations.length} conversation
              {conversations.length === 1 ? "" : "s"}
            </p>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
              <h3 className="text-base font-semibold text-stone-950">
                No SDR conversations yet
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                Paste a client reply to start the first conversation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation) => (
                <article
                  className={
                    conversation.handoff_required
                      ? "rounded-lg border-2 border-amber-400 bg-amber-50 p-5 shadow-sm"
                      : "rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
                  }
                  key={conversation.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-950">
                        {conversation.client_name ||
                          conversation.business?.business_name ||
                          conversation.website?.slug ||
                          "SDR conversation"}
                      </h3>
                      <p className="mt-1 text-sm text-stone-700">
                        {conversation.client_email ||
                          conversation.client_phone ||
                          "No contact set"}
                      </p>
                      <p className="mt-2 text-sm text-stone-600">
                        Status: {label(conversation.status)} · Intent:{" "}
                        {label(conversation.detected_intent)} · Handoff:{" "}
                        {conversation.handoff_required ? "yes" : "no"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        Last message: {formatDate(conversation.last_message_at)}
                      </p>
                      {conversation.conversation_summary ? (
                        <p className="mt-3 line-clamp-2 text-sm text-stone-700">
                          {conversation.conversation_summary}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <Link
                        className="rounded bg-emerald-700 px-2 py-1 font-semibold text-white underline-offset-4 hover:underline"
                        href={`/admin/sdr/${conversation.id}`}
                      >
                        Open
                      </Link>
                      {conversation.lead ? (
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/leads#lead-${conversation.lead.id}`}
                        >
                          Lead
                        </Link>
                      ) : null}
                      {conversation.website ? (
                        <Link
                          className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/websites/${conversation.website.id}/outreach`}
                        >
                          Outreach
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
