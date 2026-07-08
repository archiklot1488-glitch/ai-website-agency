"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { submitLeadAction } from "@/app/site/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import type { GeneratedWebsiteContent } from "@/types/generated-website";
import type { WebsiteRenderMode } from "@/types/website-rendering";

type ContactSectionProps = {
  contact: GeneratedWebsiteContent["contact"];
  mode: WebsiteRenderMode;
  websiteId: string;
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Sending..." : "Send message"}
    </button>
  );
}

function isUsableEmail(value: string) {
  return value.includes("@");
}

export function ContactSection({
  contact,
  mode,
  websiteId,
}: ContactSectionProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isPreview = mode === "preview";
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitLeadAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section className="bg-white" id="contact">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            {contact.ctaText}
          </h2>
          <div className="mt-8 space-y-4 text-stone-700">
            <p>
              <span className="font-semibold text-stone-950">City:</span>{" "}
              {contact.city}
            </p>
            <p>
              <span className="font-semibold text-stone-950">Phone:</span>{" "}
              {contact.phone}
            </p>
            <p>
              <span className="font-semibold text-stone-950">Email:</span>{" "}
              {isUsableEmail(contact.email) ? (
                <a
                  className="text-[var(--brand-primary)] underline-offset-4 hover:underline"
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              ) : (
                contact.email
              )}
            </p>
          </div>
        </div>

        <form
          action={isPreview ? undefined : formAction}
          className="rounded-lg border border-stone-200 bg-stone-50 p-5"
          ref={formRef}
        >
          <input name="website_id" type="hidden" value={websiteId} />
          {isPreview ? (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This form is disabled because this is a preview.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Name</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 disabled:bg-stone-100"
                disabled={isPreview}
                name="name"
                required={!isPreview}
                type="text"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Email</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 disabled:bg-stone-100"
                disabled={isPreview}
                name="email"
                type="email"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-stone-700">Phone</span>
            <input
              className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 disabled:bg-stone-100"
              disabled={isPreview}
              name="phone"
              type="tel"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-stone-700">Message</span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 disabled:bg-stone-100"
              disabled={isPreview}
              name="message"
              required={!isPreview}
            />
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
            <SubmitButton disabled={isPreview} />
          </div>
        </form>
      </div>
    </section>
  );
}
