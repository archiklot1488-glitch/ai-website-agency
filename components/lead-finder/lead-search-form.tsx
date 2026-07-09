"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { searchLeadCandidatesAction } from "@/app/admin/lead-finder/actions";
import { initialActionState, type ActionState } from "@/types/actions";
import type { LeadFinderProviderStatus } from "@/types/lead-finder";

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

export function LeadSearchForm({
  providerStatus,
}: {
  providerStatus: LeadFinderProviderStatus;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    searchLeadCandidatesAction,
    initialActionState,
  );
  const isGoogleMode = providerStatus.mode === "Google Places";

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-950">Find leads</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Search local businesses by niche and location, then import good
            candidates into your business list.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          <p className="font-semibold text-stone-950">{providerStatus.mode}</p>
          <p className="mt-1">DEV_MOCK_PLACES: {providerStatus.devMockPlaces}</p>
          <p>GOOGLE_PLACES_API_KEY: {providerStatus.googlePlacesApiKey}</p>
        </div>
      </div>

      {isGoogleMode ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
          Google Places mode may incur API billing costs. Searches are capped at
          20 results and request only a limited FieldMask.
        </p>
      ) : null}

      {!providerStatus.ready ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-800">
          Google Places mode is enabled, but GOOGLE_PLACES_API_KEY is missing.
          Add the key or set DEV_MOCK_PLACES=true.
        </p>
      ) : null}

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
          <span className="text-sm font-medium text-stone-700">
            Country or region
          </span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            name="country"
            placeholder="United States"
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Included type
          </span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950"
            name="included_type"
            placeholder="Optional Google type, e.g. plumber"
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
