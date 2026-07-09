"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { startSDRConversationAction } from "@/app/admin/sdr/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import { SDR_CHANNELS } from "@/types/sdr";

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-28 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

function label(value: string) {
  return value.replaceAll("_", " ");
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Analyzing..." : "Start conversation"}
    </button>
  );
}

export function StartSDRConversationForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    startSDRConversationAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">
        Start Manual SDR Conversation
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Paste a client message to store it, analyze intent, and generate a draft
        reply.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Website slug</span>
          <input className={inputClass} name="website_slug" placeholder="business-slug" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Channel</span>
          <select className={inputClass} name="channel" defaultValue="manual">
            {SDR_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {label(channel)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Client name</span>
          <input className={inputClass} name="client_name" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Client email</span>
          <input className={inputClass} name="client_email" type="email" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-stone-700">Client phone</span>
          <input className={inputClass} name="client_phone" />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">Client message</span>
        <textarea className={textareaClass} name="message" required />
      </label>

      {state.status !== "idle" ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
