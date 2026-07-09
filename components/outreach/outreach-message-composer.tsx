"use client";

import { useState, useTransition } from "react";
import {
  saveOutboundOutreachAction,
  type OutreachActionResult,
} from "@/app/admin/websites/[id]/outreach/actions";
import type { OutreachDraft } from "@/lib/outreach-message-generator";
import type { OutreachMessage } from "@/types/database";
import { OUTREACH_CHANNELS } from "@/types/outreach";

type OutreachMessageComposerProps = {
  businessId: string | null;
  draft: OutreachDraft;
  existingMessage: OutreachMessage | null;
  leadId: string | null;
  websiteId: string;
};

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-44 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value: string | null | undefined) {
  return (value || "draft").replaceAll("_", " ");
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

export function OutreachMessageComposer({
  businessId,
  draft,
  existingMessage,
  leadId,
  websiteId,
}: OutreachMessageComposerProps) {
  const [body, setBody] = useState(existingMessage?.body ?? draft.body);
  const [channel, setChannel] = useState(existingMessage?.channel ?? "manual");
  const [messageId, setMessageId] = useState(existingMessage?.id ?? null);
  const [result, setResult] = useState<OutreachActionResult | null>(null);
  const [sentManualAt, setSentManualAt] = useState(
    existingMessage?.sent_manual_at ?? null,
  );
  const [copiedAt, setCopiedAt] = useState(existingMessage?.copied_at ?? null);
  const [status, setStatus] = useState(existingMessage?.status ?? "draft");
  const [subject, setSubject] = useState(existingMessage?.subject ?? draft.subject);
  const [isPending, startTransition] = useTransition();

  function actionInput() {
    return {
      body,
      businessId,
      channel,
      leadId,
      messageId,
      messageType: draft.messageType,
      subject,
      websiteId,
    };
  }

  function applyResult(nextResult: OutreachActionResult, nextStatus?: string) {
    setResult(nextResult);

    if (nextResult.status === "success") {
      setMessageId(nextResult.messageId ?? messageId);

      if (nextStatus) {
        setStatus(nextStatus);
      }

      if (nextResult.copiedAt) {
        setCopiedAt(nextResult.copiedAt);
      }

      if (nextResult.sentManualAt) {
        setSentManualAt(nextResult.sentManualAt);
      }
    }
  }

  function save(intent: "save" | "copy" | "sent") {
    startTransition(async () => {
      const nextResult = await saveOutboundOutreachAction(actionInput(), intent);
      applyResult(
        nextResult,
        nextResult.status === "success"
          ? intent === "copy"
            ? "copied"
            : intent === "sent"
              ? "sent_manual"
              : "draft"
          : undefined,
      );
    });
  }

  function copy(value: string) {
    startTransition(async () => {
      try {
        await copyToClipboard(value);
        const nextResult = await saveOutboundOutreachAction(actionInput(), "copy");
        applyResult(nextResult, nextResult.status === "success" ? "copied" : undefined);
      } catch {
        setResult({
          status: "error",
          message: "Copy failed. Check browser clipboard permissions.",
        });
      }
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">{draft.label}</h2>
          <p className="mt-1 text-sm text-stone-600">
            Status: {statusLabel(status)} · Copied: {formatDate(copiedAt)} · Sent:{" "}
            {formatDate(sentManualAt)}
          </p>
        </div>
        <label className="block min-w-36">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
            Channel
          </span>
          <select
            className={inputClass}
            onChange={(event) => setChannel(event.target.value)}
            value={channel}
          >
            {OUTREACH_CHANNELS.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">Subject</span>
        <input
          className={inputClass}
          onChange={(event) => setSubject(event.target.value)}
          value={subject}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">Body</span>
        <textarea
          className={textareaClass}
          onChange={(event) => setBody(event.target.value)}
          value={body}
        />
      </label>

      {result ? (
        <p
          className={
            result.status === "success"
              ? "mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          }
        >
          {result.message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
          disabled={isPending}
          onClick={() => copy(subject)}
          type="button"
        >
          Copy subject
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
          disabled={isPending}
          onClick={() => copy(body)}
          type="button"
        >
          Copy body
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
          disabled={isPending}
          onClick={() => copy(`${subject}\n\n${body}`)}
          type="button"
        >
          Copy full message
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
          disabled={isPending}
          onClick={() => save("save")}
          type="button"
        >
          Save draft
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isPending}
          onClick={() => save("sent")}
          type="button"
        >
          Mark Sent Manually
        </button>
      </div>
    </section>
  );
}
