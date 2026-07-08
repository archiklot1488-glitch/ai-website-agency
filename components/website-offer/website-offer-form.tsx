"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOfferPackageAction } from "@/app/admin/websites/[id]/offer/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import type { Business } from "@/types/database";
import { OUTREACH_STATUSES, isOutreachStatus } from "@/types/offers";
import type { RenderableWebsite } from "@/types/website-rendering";

type WebsiteOfferFormProps = {
  business: Business | null;
  clientMessage: string;
  followUpMessage: string;
  liveHref: string | null;
  previewHref: string;
  previewUrl: string;
  website: RenderableWebsite;
};

const inputClass =
  "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950";
const textareaClass =
  "mt-2 min-h-36 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950";

function formatDate(value: string | null) {
  if (!value) {
    return "Not sent yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function detailValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

function SubmitButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
        disabled={pending}
        name="intent"
        type="submit"
        value="save"
      >
        {pending ? "Saving..." : "Save package"}
      </button>
      <button
        className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={pending}
        name="intent"
        type="submit"
        value="mark_sent"
      >
        {pending ? "Saving..." : "Mark Preview Sent"}
      </button>
    </div>
  );
}

export function WebsiteOfferForm({
  business,
  clientMessage,
  followUpMessage,
  liveHref,
  previewHref,
  previewUrl,
  website,
}: WebsiteOfferFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveOfferPackageAction,
    initialActionState,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyErrorKey, setCopyErrorKey] = useState<string | null>(null);
  const [clientMessageValue, setClientMessageValue] = useState(clientMessage);
  const [followUpMessageValue, setFollowUpMessageValue] =
    useState(followUpMessage);
  const [offerNotes, setOfferNotes] = useState(website.offer_notes ?? "");
  const [offerPriceCents, setOfferPriceCents] = useState(
    website.offer_price_cents === null ? "" : String(website.offer_price_cents),
  );
  const [offerCurrency, setOfferCurrency] = useState(
    website.offer_currency || "USD",
  );
  const [previewSentAt, setPreviewSentAt] = useState(website.preview_sent_at);
  const [outreachStatus, setOutreachStatus] = useState(
    isOutreachStatus(website.outreach_status)
      ? website.outreach_status
      : "not_sent",
  );

  useEffect(() => {
    if (state.status === "success" && state.message === "Preview marked sent.") {
      setOutreachStatus("sent");
      setPreviewSentAt(new Date().toISOString());
    }
  }, [state.message, state.status]);

  async function copyText(key: string, value: string) {
    setCopyErrorKey(null);
    setCopiedKey(null);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
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

      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setCopyErrorKey(key);
      window.setTimeout(() => setCopyErrorKey(null), 2200);
    }
  }

  function copyLabel(key: string) {
    if (copiedKey === key) {
      return "Copied";
    }

    if (copyErrorKey === key) {
      return "Copy failed";
    }

    return null;
  }

  function CopyButton({
    copyKey,
    label,
    value,
  }: {
    copyKey: string;
    label: string;
    value: string;
  }) {
    return (
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
        onClick={() => copyText(copyKey, value)}
        type="button"
      >
        {copyLabel(copyKey) ?? label}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="website_id" type="hidden" value={website.id} />

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        Messages are suggestions. Review before sending, include accurate sender
        identity, and add opt-out language when using them for cold email.
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            Preview Links
          </h2>
          <div className="mt-5 space-y-4 text-sm text-stone-700">
            <div>
              <p className="font-semibold text-stone-950">Preview</p>
              <Link
                className="mt-2 block break-all text-emerald-800 underline-offset-4 hover:underline"
                href={previewHref}
                target="_blank"
              >
                {previewHref}
              </Link>
              <div className="mt-3">
                <CopyButton
                  copyKey="preview-link"
                  label="Copy preview link"
                  value={previewUrl}
                />
              </div>
            </div>

            {liveHref ? (
              <div>
                <p className="font-semibold text-stone-950">Live site</p>
                <Link
                  className="mt-2 block break-all text-emerald-800 underline-offset-4 hover:underline"
                  href={liveHref}
                  target="_blank"
                >
                  {liveHref}
                </Link>
              </div>
            ) : null}

            <div className="grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-stone-950">Website status</p>
                <p className="mt-1">{website.status}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-950">Preview sent</p>
                <p className="mt-1">{formatDate(previewSentAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            Business Details
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-stone-950">Name</dt>
              <dd className="mt-1 text-stone-700">
                {detailValue(
                  business?.business_name ||
                    website.website_json.brand.businessName,
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-950">Niche</dt>
              <dd className="mt-1 text-stone-700">
                {detailValue(business?.business_type)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-950">City</dt>
              <dd className="mt-1 text-stone-700">{detailValue(business?.city)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-950">Country</dt>
              <dd className="mt-1 text-stone-700">
                {detailValue(business?.country)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-950">Phone</dt>
              <dd className="mt-1 text-stone-700">
                {detailValue(business?.phone)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-stone-950">Email</dt>
              <dd className="mt-1 text-stone-700">
                {detailValue(business?.email)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">Offer Details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_160px_220px]">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Offer price in cents
            </span>
            <input
              className={inputClass}
              min="0"
              name="offer_price_cents"
              onChange={(event) => setOfferPriceCents(event.target.value)}
              placeholder="50000"
              type="number"
              value={offerPriceCents}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Currency</span>
            <input
              className={inputClass}
              maxLength={12}
              name="offer_currency"
              onChange={(event) => setOfferCurrency(event.target.value)}
              value={offerCurrency}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              Outreach status
            </span>
            <select
              className={inputClass}
              name="outreach_status"
              onChange={(event) => {
                if (isOutreachStatus(event.target.value)) {
                  setOutreachStatus(event.target.value);
                }
              }}
              value={outreachStatus}
            >
              {OUTREACH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-stone-700">Offer notes</span>
          <textarea
            className={textareaClass}
            name="offer_notes"
            onChange={(event) => setOfferNotes(event.target.value)}
            value={offerNotes}
          />
        </label>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-stone-950">
            Initial Preview Message
          </h2>
          <CopyButton
            copyKey="client-message"
            label="Copy client message"
            value={clientMessageValue}
          />
        </div>
        <textarea
          className={textareaClass}
          name="client_message"
          onChange={(event) => setClientMessageValue(event.target.value)}
          value={clientMessageValue}
        />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-stone-950">
            Follow-Up Message
          </h2>
          <CopyButton
            copyKey="follow-up-message"
            label="Copy follow-up message"
            value={followUpMessageValue}
          />
        </div>
        <textarea
          className={textareaClass}
          name="follow_up_message"
          onChange={(event) => setFollowUpMessageValue(event.target.value)}
          value={followUpMessageValue}
        />
      </section>

      <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-stone-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            href="/admin"
          >
            Back to admin
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            href={`/admin/websites/${website.id}/edit`}
          >
            Edit website
          </Link>
        </div>
        <SubmitButtons />
      </div>
    </form>
  );
}
