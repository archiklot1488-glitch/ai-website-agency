"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  closeSDRConversationAction,
  createSDRHotLeadAction,
  markSDRNeedsHumanAction,
} from "@/app/admin/sdr/actions";
import { initialActionState, type ActionState } from "@/types/actions";

type SDRConversationActionsProps = {
  conversationId: string;
  suggestedReply: string | null;
};

function ActionButton({
  children,
  variant = "light",
}: {
  children: React.ReactNode;
  variant?: "dark" | "light";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={
        variant === "dark"
          ? "inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          : "inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
      }
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function ResultMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          : "mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      }
    >
      {state.message}
    </p>
  );
}

export function SDRConversationActions({
  conversationId,
  suggestedReply,
}: SDRConversationActionsProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [needsHumanState, needsHumanAction] = useActionState<ActionState, FormData>(
    markSDRNeedsHumanAction,
    initialActionState,
  );
  const [hotLeadState, hotLeadAction] = useActionState<ActionState, FormData>(
    createSDRHotLeadAction,
    initialActionState,
  );
  const [closeState, closeAction] = useActionState<ActionState, FormData>(
    closeSDRConversationAction,
    initialActionState,
  );

  async function copyReply() {
    if (!suggestedReply) {
      setCopyMessage("No suggested reply yet.");
      return;
    }

    try {
      await copyToClipboard(suggestedReply);
      setCopyMessage("Suggested reply copied.");
    } catch {
      setCopyMessage("Copy failed. Check browser clipboard permissions.");
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">Actions</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          onClick={copyReply}
          type="button"
        >
          Copy suggested reply
        </button>
        <form action={needsHumanAction}>
          <input name="conversation_id" type="hidden" value={conversationId} />
          <ActionButton>Mark needs human</ActionButton>
        </form>
        <form action={hotLeadAction}>
          <input name="conversation_id" type="hidden" value={conversationId} />
          <ActionButton variant="dark">Create/Update Hot Lead</ActionButton>
        </form>
        <form action={closeAction}>
          <input name="conversation_id" type="hidden" value={conversationId} />
          <ActionButton>Close conversation</ActionButton>
        </form>
      </div>
      {copyMessage ? (
        <p className="mt-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {copyMessage}
        </p>
      ) : null}
      <ResultMessage state={needsHumanState} />
      <ResultMessage state={hotLeadState} />
      <ResultMessage state={closeState} />
    </section>
  );
}
