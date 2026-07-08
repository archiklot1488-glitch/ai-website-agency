"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { searchLeadCandidatesAction } from "@/app/admin/lead-finder/actions";
import { initialActionState, type ActionState } from "@/types/actions";

function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Searching..." : "Search Leads"}
    </button>
  );
}

export function LeadSearchForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    searchLeadCandidatesAction,
    initialActionState,
  );

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-950">Find leads</h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">
        Search local businesses by niche and location, then import good
        candidates into your business list.
      </p>

      <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Niche</span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            name="niche"
            placeholder="cleaning service"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">City</span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            name="city"
            placeholder="Austin"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">Country</span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            name="country"
            placeholder="United States"
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Max results
          </span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            defaultValue="10"
            max="20"
            min="1"
            name="max_results"
            type="number"
          />
        </label>

        <div className="md:col-span-2">
          <SearchButton />
        </div>

        {state.status === "error" ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 md:col-span-2">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
