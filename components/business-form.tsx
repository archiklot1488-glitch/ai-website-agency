"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createBusinessAction } from "@/app/admin/actions";
import { initialActionState, type ActionState } from "@/types/actions";

type TextField = {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "email" | "text" | "url";
};

const textFields: TextField[] = [
  {
    name: "business_name",
    label: "Business name",
    placeholder: "Bright Smile Dental",
    required: true,
  },
  {
    name: "business_type",
    label: "Business type",
    placeholder: "Dental clinic",
  },
  {
    name: "city",
    label: "City",
    placeholder: "Austin",
  },
  {
    name: "country",
    label: "Country",
    placeholder: "United States",
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "+1 555 0100",
  },
  {
    name: "email",
    label: "Email",
    placeholder: "owner@example.com",
    type: "email",
  },
  {
    name: "website_url",
    label: "Current website",
    placeholder: "https://example.com",
    type: "url",
  },
  {
    name: "preferred_style",
    label: "Preferred style",
    placeholder: "Modern, warm, premium",
  },
  {
    name: "main_cta",
    label: "Main CTA",
    placeholder: "Book an appointment",
  },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Create business"}
    </button>
  );
}

export function BusinessForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    createBusinessAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section
      aria-labelledby="create-business-heading"
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
    >
      <h2
        className="text-xl font-semibold text-stone-950"
        id="create-business-heading"
      >
        Create business
      </h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">
        Capture the intake details needed for a future website preview.
      </p>

      <form action={formAction} className="mt-5 space-y-4" ref={formRef}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {textFields.map((field) => (
            <label className="block" key={field.name}>
              <span className="text-sm font-medium text-stone-700">
                {field.label}
                {field.required ? (
                  <span className="text-red-600" aria-hidden="true">
                    {" "}
                    *
                  </span>
                ) : null}
              </span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-blue-600"
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                type={field.type ?? "text"}
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">Services</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-blue-600"
            name="services"
            placeholder="Teeth whitening, cleanings, emergency care"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Description
          </span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm transition placeholder:text-stone-400 focus:border-blue-600"
            name="description"
            placeholder="Notes about the business, audience, tone, and offer."
          />
        </label>

        {state.status !== "idle" ? (
          <p
            className={
              state.status === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            }
          >
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </section>
  );
}
