import type {
  LeadSearchInput,
  LeadSearchMetadata,
} from "@/types/lead-finder";

const nicheTypeMappings: Record<string, string> = {
  accountant: "accounting",
  attorney: "lawyer",
  "auto repair": "car_repair",
  barber: "barber_shop",
  "beauty salon": "beauty_salon",
  "car repair": "car_repair",
  dentist: "dentist",
  "electrical contractor": "electrician",
  electrician: "electrician",
  florist: "florist",
  "hair salon": "hair_salon",
  insurance: "insurance_agency",
  "insurance agency": "insurance_agency",
  lawyer: "lawyer",
  locksmith: "locksmith",
  "moving company": "moving_company",
  painter: "painter",
  plumber: "plumber",
  plumbing: "plumber",
  "real estate": "real_estate_agency",
  "real estate agency": "real_estate_agency",
  restaurant: "restaurant",
  roofer: "roofing_contractor",
  roofing: "roofing_contractor",
  storage: "storage",
};

const allowedIncludedTypes = new Set([
  "accounting",
  "barber_shop",
  "beauty_salon",
  "car_repair",
  "dentist",
  "electrician",
  "florist",
  "hair_salon",
  "insurance_agency",
  "lawyer",
  "locksmith",
  "moving_company",
  "painter",
  "plumber",
  "real_estate_agency",
  "restaurant",
  "roofing_contractor",
  "storage",
]);

const serviceIncludedTypes = new Set([
  "electrician",
  "locksmith",
  "moving_company",
  "painter",
  "plumber",
  "roofing_contractor",
]);

const serviceNicheTerms = new Set([
  "air conditioning",
  "cleaning",
  "cleaning service",
  "electrical contractor",
  "electrician",
  "house cleaning",
  "hvac",
  "landscaping",
  "locksmith",
  "moving company",
  "pest control",
  "plumber",
  "plumbing",
  "roofer",
  "roofing",
]);

const regionAliases: Record<string, string> = {
  america: "US",
  canada: "CA",
  deutschland: "DE",
  france: "FR",
  germany: "DE",
  poland: "PL",
  uk: "GB",
  "united kingdom": "GB",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
};

export type GooglePlacesSearchPlan = {
  includePureServiceAreaBusinesses: boolean;
  invalidIncludedType: string | null;
  mappingWarning: string | null;
  regionCode: string | null;
  resolvedIncludedType: string | null;
  strictTypeFiltering: boolean;
  textQueries: string[];
};

function normalizeNiche(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeIncludedType(value: string | null | undefined) {
  return normalizeNiche(value ?? "").replace(/\s+/g, "_");
}

function locationText(input: LeadSearchInput) {
  return `${input.city}${input.country ? `, ${input.country}` : ""}`;
}

export function humanizePlaceType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function resolveRegionCode(country: string | null | undefined) {
  const normalized = normalizeNiche(country ?? "");

  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return regionAliases[normalized] ?? null;
}

export function resolveGooglePlacesSearchPlan(
  input: LeadSearchInput,
): GooglePlacesSearchPlan {
  const normalizedNiche = normalizeNiche(input.niche);
  const manualIncludedType = normalizeIncludedType(input.includedType);
  const mappedIncludedType = nicheTypeMappings[normalizedNiche] ?? null;
  const requestedIncludedType = manualIncludedType || mappedIncludedType;
  const invalidIncludedType =
    requestedIncludedType && !allowedIncludedTypes.has(requestedIncludedType)
      ? requestedIncludedType
      : null;
  const resolvedIncludedType = invalidIncludedType
    ? null
    : requestedIncludedType || null;
  const typeDisplayName = humanizePlaceType(resolvedIncludedType);
  const location = locationText(input);
  const textQueries = [`${input.niche} in ${location}`];

  if (resolvedIncludedType && typeDisplayName) {
    const mappedQuery = `${typeDisplayName.toLowerCase()} in ${location}`;

    if (!textQueries.includes(mappedQuery)) {
      textQueries.push(mappedQuery);
    }
  } else {
    textQueries.push(`${input.niche} services in ${location}`);
  }

  return {
    includePureServiceAreaBusinesses:
      serviceIncludedTypes.has(resolvedIncludedType ?? "") ||
      serviceNicheTerms.has(normalizedNiche),
    invalidIncludedType,
    mappingWarning:
      resolvedIncludedType || invalidIncludedType
        ? null
        : "No exact Google includedType is available for this niche; using text search + filtering.",
    regionCode: resolveRegionCode(input.country),
    resolvedIncludedType,
    strictTypeFiltering: Boolean(resolvedIncludedType),
    textQueries,
  };
}

export function validateManualIncludedType(value: string | null | undefined) {
  const normalized = normalizeIncludedType(value);

  if (!normalized) {
    return {
      includedType: null,
      ok: true as const,
    };
  }

  if (allowedIncludedTypes.has(normalized)) {
    return {
      includedType: normalized,
      ok: true as const,
    };
  }

  return {
    includedType: normalized,
    ok: false as const,
  };
}

export function createSearchMetadata(
  plan: GooglePlacesSearchPlan,
  counts: {
    filteredOutCount: number;
    rawReturnedCount: number;
    savedCandidateCount: number;
  },
): LeadSearchMetadata {
  const warnings: string[] = [];

  if (plan.mappingWarning) {
    warnings.push(plan.mappingWarning);
  }

  if (plan.invalidIncludedType) {
    warnings.push(
      `Unsupported Google includedType "${plan.invalidIncludedType}" was omitted; using text search + filtering.`,
    );
  }

  if (counts.rawReturnedCount === 0) {
    warnings.push("Google returned zero results.");
  }

  if (
    counts.rawReturnedCount > 0 &&
    counts.filteredOutCount >= Math.ceil(counts.rawReturnedCount / 2)
  ) {
    warnings.push("Many Google results were filtered as non-business places.");
  }

  return {
    filteredOutCount: counts.filteredOutCount,
    includePureServiceAreaBusinesses: plan.includePureServiceAreaBusinesses,
    rawReturnedCount: counts.rawReturnedCount,
    regionCode: plan.regionCode,
    resolvedIncludedType: plan.resolvedIncludedType,
    savedCandidateCount: counts.savedCandidateCount,
    strictTypeFiltering: plan.strictTypeFiltering,
    textQueries: plan.textQueries,
    warnings,
  };
}
