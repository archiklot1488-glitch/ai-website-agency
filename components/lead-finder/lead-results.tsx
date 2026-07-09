import Link from "next/link";
import { importLeadCandidateAction } from "@/app/admin/lead-finder/actions";
import type { LeadSearchWithCandidates } from "@/lib/lead-finder/searches";
import type { Json } from "@/types/database";

type LeadResultsProps = {
  importError?: string | null;
  importedBusinessId?: string | null;
  leadSearch: LeadSearchWithCandidates | null;
};

function scoreClasses(score: number) {
  if (score >= 75) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (score >= 55) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-stone-200 bg-stone-50 text-stone-700";
}

function isRecord(
  value: Json | undefined,
): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function signalReasons(rawData: Json | null, fallback: string[]) {
  if (isRecord(rawData) && isRecord(rawData.leadFinder)) {
    const signals = rawData.leadFinder.signals;

    if (
      Array.isArray(signals) &&
      signals.every((signal) => typeof signal === "string")
    ) {
      return signals;
    }
  }

  return fallback;
}

export function LeadResults({
  importError,
  importedBusinessId,
  leadSearch,
}: LeadResultsProps) {
  if (!leadSearch) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-stone-950">
          No search selected
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Run a lead search to see candidate businesses here.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-950">
              {leadSearch.query}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {leadSearch.result_count} results from {leadSearch.provider}
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
            href="/admin"
          >
            View businesses
          </Link>
        </div>

        {importedBusinessId ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Candidate linked to business record {importedBusinessId}.{" "}
            <Link className="font-semibold underline" href="/admin">
              Back to business list
            </Link>
            .
          </p>
        ) : null}

        {importError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {importError}
          </p>
        ) : null}
      </div>

      {leadSearch.candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
          <h3 className="text-base font-semibold text-stone-950">
            No candidates found
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            Try a broader niche, nearby city, or fewer type filters.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {leadSearch.candidates.map((candidate) => {
          const reasons = signalReasons(candidate.raw_data, [
            candidate.website_url
              ? "Already has website"
              : "Missing website in Places data",
            candidate.phone ? "Has phone number" : "Phone missing",
            candidate.google_maps_url
              ? "Has Google Maps listing"
              : "Google Maps link missing",
          ]);

          return (
            <article
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
              key={candidate.id}
            >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-stone-950">
                    {candidate.business_name}
                  </h3>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreClasses(
                      candidate.lead_score,
                    )}`}
                  >
                    Score {candidate.lead_score}
                  </span>
                </div>

                <p className="mt-2 text-sm text-stone-600">
                  {candidate.category || "No category"} ·{" "}
                  {candidate.business_status || "Status unknown"} ·{" "}
                  {candidate.provider}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {candidate.address || "Address missing"}
                </p>

                <div className="mt-4 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-stone-950">Phone:</span>{" "}
                    {candidate.phone || "Missing"}
                  </p>
                  <p>
                    <span className="font-semibold text-stone-950">
                      Rating:
                    </span>{" "}
                    {candidate.rating ?? "N/A"} ({candidate.review_count ?? 0}{" "}
                    reviews)
                  </p>
                  <p>
                    <span className="font-semibold text-stone-950">
                      Website:
                    </span>{" "}
                    {candidate.website_url ? (
                      <a
                        className="break-all text-blue-700 underline-offset-4 hover:underline"
                        href={candidate.website_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {candidate.website_url}
                      </a>
                    ) : (
                      "No website found in Google Places data"
                    )}
                  </p>
                  <p>
                    <span className="font-semibold text-stone-950">
                      Google Maps:
                    </span>{" "}
                    {candidate.google_maps_url ? (
                      <a
                        className="text-blue-700 underline-offset-4 hover:underline"
                        href={candidate.google_maps_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                <p className="mt-4 rounded-md bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-700">
                  {candidate.qualification || "No qualification set."}
                </p>

                {reasons.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reasons.map((reason) => (
                      <span
                        className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700"
                        key={reason}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="w-full shrink-0 lg:w-44">
                {candidate.imported_business_id ? (
                  <Link
                    className="inline-flex h-10 w-full items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800"
                    href="/admin"
                  >
                    Imported
                  </Link>
                ) : (
                  <form action={importLeadCandidateAction}>
                    <input
                      name="candidate_id"
                      type="hidden"
                      value={candidate.id}
                    />
                    <input
                      name="search_id"
                      type="hidden"
                      value={leadSearch.id}
                    />
                    <button
                      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      type="submit"
                    >
                      Import
                    </button>
                  </form>
                )}
              </div>
            </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
