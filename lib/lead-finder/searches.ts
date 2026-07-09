import "server-only";

import { getLeadFinderProvider } from "@/lib/lead-finder/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BusinessInsert,
  Json,
  LeadCandidateInsert,
  LeadCandidateRow,
  LeadSearch,
} from "@/types/database";
import type { LeadCandidate, LeadSearchInput } from "@/types/lead-finder";

export type LeadSearchWithCandidates = LeadSearch & {
  candidates: LeadCandidateRow[];
};

function candidateToInsert(
  leadSearchId: string,
  candidate: LeadCandidate,
): LeadCandidateInsert {
  return {
    lead_search_id: leadSearchId,
    provider: candidate.provider,
    provider_place_id: candidate.providerPlaceId,
    business_name: candidate.businessName,
    category: candidate.category,
    address: candidate.address,
    city: candidate.city,
    country: candidate.country,
    phone: candidate.phone,
    website_url: candidate.websiteUrl,
    google_maps_url: candidate.googleMapsUrl,
    rating: candidate.rating,
    review_count: candidate.reviewCount,
    business_status: candidate.businessStatus,
    has_website: candidate.hasWebsite,
    lead_score: candidate.leadScore,
    qualification: candidate.qualification,
    raw_data: candidate.rawData,
  };
}

function normalizeIdentity(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function dedupeCandidates(candidates: LeadCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const keys: string[] = [
      candidate.providerPlaceId
        ? `${candidate.provider}:place:${candidate.providerPlaceId}`
        : null,
      candidate.phone
        ? `${candidate.provider}:phone:${normalizeIdentity(candidate.phone)}`
        : null,
      [
          candidate.provider,
          "name_address",
          normalizeIdentity(candidate.businessName),
          normalizeIdentity(candidate.address),
        ].join(":"),
    ].filter((key): key is string => Boolean(key));

    if (keys.some((key) => seen.has(key))) {
      return false;
    }

    for (const key of keys) {
      seen.add(key);
    }

    return true;
  });
}

export async function createLeadSearch(input: LeadSearchInput) {
  const provider = getLeadFinderProvider();
  const result = await provider.searchBusinesses(input);
  const supabase = createSupabaseServerClient();
  const candidates = dedupeCandidates(result.candidates);
  const metadata = {
    ...result.metadata,
    savedCandidateCount: candidates.length,
  } satisfies Json;

  const { data: leadSearch, error: searchError } = await supabase
    .from("lead_searches")
    .insert({
      query: result.query,
      niche: input.niche,
      city: input.city,
      country: input.country,
      provider: result.provider,
      status: "completed",
      result_count: candidates.length,
      metadata,
    })
    .select("*")
    .single();

  if (searchError || !leadSearch) {
    throw new Error(searchError?.message || "Lead search could not be saved.");
  }

  if (candidates.length > 0) {
    const { error: candidatesError } = await supabase
      .from("lead_candidates")
      .insert(
        candidates.map((candidate) =>
          candidateToInsert(leadSearch.id, candidate),
        ),
      );

    if (candidatesError) {
      throw new Error(candidatesError.message);
    }
  }

  return leadSearch;
}

export async function getLeadSearchWithCandidates(
  leadSearchId: string,
): Promise<LeadSearchWithCandidates | null> {
  const supabase = createSupabaseServerClient();
  const { data: leadSearch, error: searchError } = await supabase
    .from("lead_searches")
    .select("*")
    .eq("id", leadSearchId)
    .single();

  if (searchError || !leadSearch) {
    return null;
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("lead_candidates")
    .select("*")
    .eq("lead_search_id", leadSearchId)
    .order("lead_score", { ascending: false });

  if (candidatesError) {
    throw new Error(candidatesError.message);
  }

  return {
    ...leadSearch,
    candidates: candidates ?? [],
  };
}

async function findDuplicateBusiness(candidate: LeadCandidateRow) {
  const supabase = createSupabaseServerClient();
  const normalizedCandidateName = normalizeIdentity(candidate.business_name);
  const normalizedCandidateCity = normalizeIdentity(candidate.city);
  const normalizedCandidateWebsite = normalizeIdentity(candidate.website_url);

  if (candidate.provider_place_id) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("source_place_id", candidate.provider_place_id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data.id;
    }
  }

  if (candidate.website_url) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("website_url", candidate.website_url)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data.id;
    }
  }

  let query = supabase
    .from("businesses")
    .select("id,business_name,city,website_url")
    .ilike("business_name", candidate.business_name)
    .limit(25);

  if (candidate.city) {
    query = query.ilike("city", candidate.city);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const duplicate = (data ?? []).find((business) => {
    const namesMatch =
      normalizeIdentity(business.business_name) === normalizedCandidateName;
    const citiesMatch =
      !normalizedCandidateCity ||
      normalizeIdentity(business.city) === normalizedCandidateCity;
    const websitesMatch =
      normalizedCandidateWebsite &&
      normalizeIdentity(business.website_url) === normalizedCandidateWebsite;

    return websitesMatch || (namesMatch && citiesMatch);
  });

  return duplicate?.id ?? null;
}

export async function importLeadCandidate(candidateId: string) {
  const supabase = createSupabaseServerClient();
  const { data: candidate, error: candidateError } = await supabase
    .from("lead_candidates")
    .select("*")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    throw new Error(candidateError?.message || "Lead candidate could not be found.");
  }

  if (candidate.imported_business_id) {
    return candidate.imported_business_id;
  }

  const duplicateBusinessId = await findDuplicateBusiness(candidate);

  if (duplicateBusinessId) {
    const { error: updateError } = await supabase
      .from("lead_candidates")
      .update({ imported_business_id: duplicateBusinessId })
      .eq("id", candidate.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return duplicateBusinessId;
  }

  const payload: BusinessInsert = {
    business_name: candidate.business_name,
    business_type: candidate.category,
    city: candidate.city,
    country: candidate.country,
    phone: candidate.phone,
    website_url: candidate.website_url,
    description: [
      "Imported from Lead Finder.",
      candidate.address ? `Address from Places: ${candidate.address}.` : null,
      candidate.qualification,
    ]
      .filter(Boolean)
      .join(" "),
    status: "draft",
    source: candidate.provider,
    source_place_id: candidate.provider_place_id,
    google_maps_url: candidate.google_maps_url,
    rating: candidate.rating,
    review_count: candidate.review_count,
    lead_score: candidate.lead_score,
    qualification: candidate.qualification,
  };

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert(payload)
    .select("*")
    .single();

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be imported.");
  }

  const { error: updateError } = await supabase
    .from("lead_candidates")
    .update({ imported_business_id: business.id })
    .eq("id", candidate.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return business.id;
}
