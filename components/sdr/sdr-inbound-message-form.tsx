"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addSDRInboundMessageAction } from "@/app/admin/sdr/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import type { SDRConversation } from "@/types/database";

type SDRInboundMessageFormProps = {
  conversation: SDRConversation;
};

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-28 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Analyzing..." : "Add and Analyze Message"}
    </button>
  );
}

export function SDRInboundMessageForm({
  conversation,
}: SDRInboundMessageFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    addSDRInboundMessageAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <input name="conversation_id" type="hidden" value={conversation.id} />
      <h2 className="text-xl font-semibold text-stone-950">
        Add Inbound Message
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Client name</span>
          <input
            className={inputClass}
            defaultValue={conversation.client_name ?? ""}
            name="client_name"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Client email</span>
          <input
            className={inputClass}
            defaultValue={conversation.client_email ?? ""}
            name="client_email"
            type="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Client phone</span>
          <input
            className={inputClass}
            defaultValue={conversation.client_phone ?? ""}
            name="client_phone"
          />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">Message</span>
        <textarea className={textareaClass} name="message" required />
      </label>
      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}
      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
