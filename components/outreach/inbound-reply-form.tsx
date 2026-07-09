"use client";

import { useState, useTransition } from "react";
import {
  saveInboundReplyAction,
  type OutreachActionResult,
} from "@/app/admin/websites/[id]/outreach/actions";
import { REPLY_CATEGORIES } from "@/types/outreach";

type InboundReplyFormProps = {
  businessId: string | null;
  leadId: string | null;
  websiteId: string;
};

const textareaClass =
  "mt-2 min-h-32 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function InboundReplyForm({
  businessId,
  leadId,
  websiteId,
}: InboundReplyFormProps) {
  const [body, setBody] = useState("");
  const [replyCategory, setReplyCategory] = useState("interested");
  const [result, setResult] = useState<OutreachActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveReply() {
    startTransition(async () => {
      const nextResult = await saveInboundReplyAction({
        body,
        businessId,
        leadId,
        replyCategory,
        websiteId,
      });

      setResult(nextResult);

      if (nextResult.status === "success") {
        setBody("");
      }
    });
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">
        Paste Client Reply
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Hot categories create or update a high-priority lead for manual follow-up.
      </p>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">
          Reply category
        </span>
        <select
          className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
          onChange={(event) => setReplyCategory(event.target.value)}
          value={replyCategory}
        >
          {REPLY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {label(category)}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-stone-700">Reply body</span>
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

      <button
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={isPending}
        onClick={saveReply}
        type="button"
      >
        {isPending ? "Saving..." : "Save reply"}
      </button>
    </section>
  );
}
