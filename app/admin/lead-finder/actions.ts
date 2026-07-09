"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createLeadSearch,
  importLeadCandidate,
} from "@/lib/lead-finder/searches";
import { validateManualIncludedType } from "@/lib/lead-finder/google-search-plan";
import type { ActionState } from "@/types/actions";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseMaxResults(value: string | null) {
  const parsed = Number(value ?? "10");

  if (!Number.isInteger(parsed)) {
    return 10;
  }

  return Math.max(1, Math.min(parsed, 20));
}

function leadFinderPath(
  searchId: string | null,
  params: Record<string, string> = {},
) {
  const query = new URLSearchParams();

  if (searchId) {
    query.set("search", searchId);
  }

  for (const [key, value] of Object.entries(params)) {
    query.set(key, value);
  }

  const queryString = query.toString();
  return `/admin/lead-finder${queryString ? `?${queryString}` : ""}`;
}

export async function searchLeadCandidatesAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const niche = valueFromForm(formData, "niche");
  const city = valueFromForm(formData, "city");
  const country = valueFromForm(formData, "country");
  const includedType = valueFromForm(formData, "included_type");
  const maxResults = parseMaxResults(valueFromForm(formData, "max_results"));
  const includedTypeValidation = validateManualIncludedType(includedType);

  if (!niche) {
    return {
      status: "error",
      message: "Enter a niche or category.",
    };
  }

  if (!city) {
    return {
      status: "error",
      message: "Enter a city.",
    };
  }

  if (!includedTypeValidation.ok) {
    return {
      status: "error",
      message: `Unsupported Google includedType "${includedTypeValidation.includedType}". Leave the field blank to use text search + filtering.`,
    };
  }

  let leadSearchId: string;

  try {
    const leadSearch = await createLeadSearch({
      niche,
      city,
      country,
      includedType: includedTypeValidation.includedType,
      maxResults,
    });
    leadSearchId = leadSearch.id;
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Lead search could not be completed.",
    };
  }

  revalidatePath("/admin/lead-finder");
  redirect(`/admin/lead-finder?search=${leadSearchId}`);
}

export async function importLeadCandidateAction(formData: FormData) {
  const isAdmin = await requireAdmin();
  const searchId = valueFromForm(formData, "search_id");
  const candidateId = valueFromForm(formData, "candidate_id");

  if (!isAdmin || !candidateId) {
    redirect(
      leadFinderPath(searchId, {
        import_error: "Could not import candidate",
      }),
    );
  }

  try {
    const businessId = await importLeadCandidate(candidateId);
    revalidatePath("/admin");
    revalidatePath("/admin/lead-finder");
    redirect(
      leadFinderPath(searchId, {
        imported: businessId,
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Candidate could not be imported.";
    redirect(
      leadFinderPath(searchId, {
        import_error: message,
      }),
    );
  }
}
