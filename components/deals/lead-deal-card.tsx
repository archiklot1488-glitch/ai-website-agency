"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  launchWebsiteAction,
  saveLeadDealAction,
} from "@/app/admin/leads/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import { LEAD_PRIORITIES, LEAD_STATUSES } from "@/types/deals";
import type { LeadDeal } from "@/lib/deals";

type LeadDealCardProps = {
  lead: LeadDeal;
};

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

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
  if (!value) {
    return "Not set";
  }

  return value.replaceAll("_", " ");
}

function detail(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

function SaveButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={pending}
        name="intent"
        type="submit"
        value="save"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100"
        disabled={pending}
        name="intent"
        type="submit"
        value="contacted"
      >
        Mark contacted
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-stone-100"
        disabled={pending}
        name="intent"
        type="submit"
        value="paid_manual"
      >
        Mark paid manual
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-stone-100"
        disabled={pending}
        name="intent"
        type="submit"
        value="lost"
      >
        Mark lost
      </button>
    </div>
  );
}

function LaunchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Launching..." : "Launch Website"}
    </button>
  );
}

export function LeadDealCard({ lead }: LeadDealCardProps) {
  const router = useRouter();
  const [saveState, saveAction] = useActionState<ActionState, FormData>(
    saveLeadDealAction,
    initialActionState,
  );
  const [launchState, launchAction] = useActionState<ActionState, FormData>(
    launchWebsiteAction,
    initialActionState,
  );
  const statusMessage =
    launchState.status !== "idle" ? launchState : saveState.status !== "idle" ? saveState : null;
  const cardClass = lead.isHot
    ? "rounded-lg border-2 border-amber-400 bg-amber-50/60 p-5 shadow-sm"
    : "rounded-lg border border-stone-200 bg-white p-5 shadow-sm";
  const linkedWebsiteId = lead.linked_website_id || lead.website_id;
  const showLaunch = Boolean(linkedWebsiteId && lead.status === "paid_manual");

  useEffect(() => {
    if (saveState.status === "success" || launchState.status === "success") {
      router.refresh();
    }
  }, [launchState.status, router, saveState.status]);

  return (
    <article className={cardClass} id={`lead-${lead.id}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-stone-950">
              {detail(lead.name)}
            </h3>
            {lead.isHot ? (
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white">
                Hot lead
              </span>
            ) : null}
          </div>
          <div className="mt-2 grid gap-1 text-sm text-stone-700 sm:grid-cols-2 lg:grid-cols-3">
            <p>Email: {detail(lead.email)}</p>
            <p>Phone: {detail(lead.phone)}</p>
            <p>Source: {label(lead.source)}</p>
            <p>Created: {formatDate(lead.created_at)}</p>
            <p>Last contacted: {formatDate(lead.last_contacted_at)}</p>
            <p>Payment: {detail(lead.preferred_payment_method)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {lead.website ? (
            <>
              <Link
                className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                href={`/preview/${lead.website.slug}?token=${lead.website.preview_token}`}
                target="_blank"
              >
                Preview
              </Link>
              {lead.website.status === "live" ? (
                <Link
                  className="rounded bg-stone-100 px-2 py-1 text-stone-800 underline-offset-4 hover:underline"
                  href={`/site/${lead.website.slug}`}
                  target="_blank"
                >
                  Live
                </Link>
              ) : null}
            </>
          ) : null}
          {lead.business ? (
            <span className="rounded bg-stone-100 px-2 py-1 text-stone-700">
              {lead.business.business_name}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
        <div>
          <p className="font-semibold text-stone-950">Message</p>
          <p className="mt-1 whitespace-pre-wrap text-stone-700">
            {detail(lead.message)}
          </p>
        </div>
        <div>
          <p className="font-semibold text-stone-950">Related website</p>
          <p className="mt-1 text-stone-700">
            {lead.website
              ? `${lead.website.slug} (${lead.website.status})`
              : detail(linkedWebsiteId)}
          </p>
        </div>
        <div>
          <p className="font-semibold text-stone-950">Deal value</p>
          <p className="mt-1 text-stone-700">
            {lead.deal_value_cents === null
              ? "Not set"
              : `${lead.deal_value_cents} ${lead.deal_currency}`}
          </p>
        </div>
      </div>

      <form action={saveAction} className="mt-5 space-y-4">
        <input name="lead_id" type="hidden" value={lead.id} />
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select className={inputClass} defaultValue={lead.status} name="status">
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Priority</span>
            <select
              className={inputClass}
              defaultValue={lead.priority}
              name="priority"
            >
              {LEAD_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {label(priority)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Deal value in cents
            </span>
            <input
              className={inputClass}
              defaultValue={lead.deal_value_cents ?? ""}
              min="0"
              name="deal_value_cents"
              type="number"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Currency</span>
            <input
              className={inputClass}
              defaultValue={lead.deal_currency}
              maxLength={12}
              name="deal_currency"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Preferred payment method
          </span>
          <input
            className={inputClass}
            defaultValue={lead.preferred_payment_method ?? ""}
            name="preferred_payment_method"
            placeholder="Bank transfer, cash, invoice, etc."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Conversation summary
            </span>
            <textarea
              className={textareaClass}
              defaultValue={lead.conversation_summary ?? ""}
              name="conversation_summary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Admin notes
            </span>
            <textarea
              className={textareaClass}
              defaultValue={lead.admin_notes ?? ""}
              name="admin_notes"
            />
          </label>
        </div>

        {statusMessage ? (
          <p
            className={
              statusMessage.status === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            }
          >
            {statusMessage.message}
          </p>
        ) : null}

        <SaveButtons />
      </form>

      {showLaunch ? (
        <form action={launchAction} className="mt-4 border-t border-stone-200 pt-4">
          <input name="lead_id" type="hidden" value={lead.id} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-700">
              Payment is marked manual. Launching will publish the linked
              website and move this lead to launched.
            </p>
            <LaunchButton />
          </div>
        </form>
      ) : null}
    </article>
  );
}
