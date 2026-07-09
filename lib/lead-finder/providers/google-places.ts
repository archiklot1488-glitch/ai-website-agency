import "server-only";

import {
  createSearchMetadata,
  humanizePlaceType,
  resolveGooglePlacesSearchPlan,
} from "@/lib/lead-finder/google-search-plan";
import { withLeadScore } from "@/lib/lead-finder/scoring";
import type {
  LeadCandidate,
  LeadFinderProvider,
  LeadSearchInput,
  LeadSearchResult,
} from "@/types/lead-finder";

const GOOGLE_PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "nextPageToken",
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
].join(",");

type GoogleTextSearchResponse = {
  nextPageToken?: string;
  places?: GooglePlace[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GoogleLocalizedText = {
  text?: string;
};

type GooglePlace = {
  id?: string;
  displayName?: GoogleLocalizedText;
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
};

function sanitizeGoogleError(message: string) {
  return message.replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]");
}

function maxResults(value: number) {
  return Math.max(1, Math.min(value, 20));
}

function pageSize(value: number) {
  return value <= 10 ? 10 : 20;
}

function normalizeValue(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stablePlaceKeys(place: GooglePlace, fallbackIndex: number) {
  const keys: string[] = [];

  if (place.id) {
    keys.push(`id:${place.id}`);
  }

  if (place.nationalPhoneNumber || place.internationalPhoneNumber) {
    keys.push(
      `phone:${normalizeValue(
        place.nationalPhoneNumber ?? place.internationalPhoneNumber,
      )}`,
    );
  }

  keys.push(
    [
      "name_address",
      normalizeValue(place.displayName?.text ?? "unknown"),
      normalizeValue(place.formattedAddress ?? String(fallbackIndex)),
    ].join(":"),
  );

  return keys;
}

function buildGoogleError(response: Response, body: GoogleTextSearchResponse) {
  const googleStatus = body.error?.status;
  const message = body.error?.message
    ? sanitizeGoogleError(body.error.message)
    : null;

  if (response.status === 400) {
    return `Google Places rejected the search request${
      message ? `: ${message}` : ". Check niche, city, and included type."
    }`;
  }

  if (response.status === 401 || response.status === 403) {
    return `Google Places authentication failed${
      message ? `: ${message}` : ". Check GOOGLE_PLACES_API_KEY and API permissions."
    }`;
  }

  if (response.status === 429 || googleStatus === "RESOURCE_EXHAUSTED") {
    return "Google Places quota or rate limit was reached. Try again later or reduce search volume.";
  }

  if (response.status >= 500) {
    return "Google Places is temporarily unavailable. Try again later.";
  }

  return message
    ? `Google Places search failed: ${message}`
    : `Google Places search failed with status ${response.status}.`;
}

async function readGoogleResponse(response: Response) {
  try {
    return (await response.json()) as GoogleTextSearchResponse;
  } catch {
    return {
      error: {
        message: "Google Places returned a response that was not JSON.",
      },
    } satisfies GoogleTextSearchResponse;
  }
}

const nonBusinessTypes = new Set([
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "administrative_area_level_4",
  "administrative_area_level_5",
  "administrative_area_level_6",
  "administrative_area_level_7",
  "country",
  "locality",
  "political",
  "postal_code",
  "route",
  "street_address",
]);

const streetSuffixPattern =
  /\b(alley|ave|avenue|blvd|boulevard|cir|circle|court|ct|drive|dr|highway|hwy|lane|ln|parkway|pkwy|place|pl|road|rd|route|row|square|sq|st|street|terrace|ter|trail|trl|way)\b/i;

function isAddressLikeName(value: string) {
  const normalized = normalizeValue(value);

  return (
    /^\d+[a-z]?\s+/.test(normalized) ||
    (streetSuffixPattern.test(value) &&
      !/\b(barber|beauty|cleaning|dental|dentist|electric|hvac|law|legal|locksmith|plumb|restaurant|roof|salon|service|services)\b/i.test(
        value,
      ))
  );
}

function hasOnlyNonBusinessTypes(place: GooglePlace) {
  const types = [place.primaryType, ...(place.types ?? [])].filter(
    (type): type is string => Boolean(type),
  );

  return (
    types.length > 0 &&
    types.every(
      (type) =>
        nonBusinessTypes.has(type) ||
        type.startsWith("administrative_area_level_"),
    )
  );
}

function hasBusinessSignal(place: GooglePlace) {
  return Boolean(
    place.nationalPhoneNumber ||
      place.internationalPhoneNumber ||
      place.websiteUri ||
      place.googleMapsUri ||
      typeof place.rating === "number" ||
      typeof place.userRatingCount === "number",
  );
}

function rejectionReason(place: GooglePlace) {
  const displayName = place.displayName?.text?.trim();

  if (!displayName) {
    return "missing display name";
  }

  if (place.businessStatus === "CLOSED_PERMANENTLY") {
    return "closed permanently";
  }

  if (isAddressLikeName(displayName)) {
    return "display name looks like a street or address";
  }

  if (
    place.formattedAddress &&
    normalizeValue(displayName) === normalizeValue(place.formattedAddress)
  ) {
    return "display name matches formatted address";
  }

  if (hasOnlyNonBusinessTypes(place)) {
    return "place types are not business types";
  }

  if (!hasBusinessSignal(place)) {
    return "missing business signals";
  }

  return null;
}

function logRejection(place: GooglePlace, reason: string) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[Lead Finder] Rejected Google Places result", {
    businessStatus: place.businessStatus ?? null,
    displayName: place.displayName?.text ?? null,
    primaryType: place.primaryType ?? null,
    reason,
    types: place.types ?? [],
  });
}

export class GooglePlacesLeadFinderProvider implements LeadFinderProvider {
  readonly provider = "google_places";

  constructor(private readonly apiKey: string) {}

  private async fetchPage(body: Record<string, string | number | boolean>) {
    let response: Response;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      throw new Error(
        "Google Places search could not be reached. Try again with fewer results or check network access.",
      );
    }

    const responseBody = await readGoogleResponse(response);

    if (!response.ok) {
      throw new Error(buildGoogleError(response, responseBody));
    }

    return responseBody;
  }

  async searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> {
    const plan = resolveGooglePlacesSearchPlan(input);
    const limit = maxResults(input.maxResults);
    const seen = new Set<string>();
    const candidates: LeadCandidate[] = [];
    let filteredOutCount = 0;
    let pagesRequested = 0;
    let rawReturnedCount = 0;

    for (const [queryIndex, textQuery] of plan.textQueries.entries()) {
      let pageToken: string | undefined;

      while (pagesRequested < 2 && candidates.length < limit) {
        const body: Record<string, string | number | boolean> = {
          includePureServiceAreaBusinesses:
            plan.includePureServiceAreaBusinesses,
          pageSize: pageSize(limit),
          textQuery,
        };

        if (plan.resolvedIncludedType) {
          body.includedType = plan.resolvedIncludedType;
          body.strictTypeFiltering = plan.strictTypeFiltering;
        }

        if (plan.regionCode) {
          body.regionCode = plan.regionCode;
        }

        if (pageToken) {
          body.pageToken = pageToken;
        }

        const responseBody = await this.fetchPage(body);
        pagesRequested += 1;
        const places = responseBody.places ?? [];
        rawReturnedCount += places.length;

        for (const [index, place] of places.entries()) {
          const reason = rejectionReason(place);

          if (reason) {
            filteredOutCount += 1;
            logRejection(place, reason);
            continue;
          }

          const duplicateKey = stablePlaceKeys(place, index).find((key) =>
            seen.has(key),
          );

          if (duplicateKey) {
            continue;
          }

          for (const key of stablePlaceKeys(place, index)) {
            seen.add(key);
          }

          const websiteUrl = place.websiteUri ?? null;
          const primaryType = humanizePlaceType(place.primaryType);
          const fallbackType = humanizePlaceType(place.types?.[0]);

          candidates.push(
            withLeadScore({
              provider: this.provider,
              providerPlaceId: place.id ?? null,
              businessName: place.displayName?.text ?? "Unnamed business",
              category: primaryType ?? fallbackType ?? input.niche,
              address: place.formattedAddress ?? null,
              city: input.city,
              country: input.country,
              phone:
                place.nationalPhoneNumber ??
                place.internationalPhoneNumber ??
                null,
              websiteUrl,
              googleMapsUrl: place.googleMapsUri ?? null,
              rating: typeof place.rating === "number" ? place.rating : null,
              reviewCount:
                typeof place.userRatingCount === "number"
                  ? place.userRatingCount
                  : null,
              businessStatus: place.businessStatus ?? null,
              hasWebsite: Boolean(websiteUrl),
              rawData: place,
            }),
          );

          if (candidates.length >= limit) {
            break;
          }
        }

        pageToken = responseBody.nextPageToken;

        if (!pageToken) {
          break;
        }

        if (
          candidates.length === 0 &&
          queryIndex < plan.textQueries.length - 1
        ) {
          break;
        }
      }

      if (candidates.length > 0) {
        break;
      }

      if (pagesRequested >= 2) {
        break;
      }
    }

    const savedCandidates = candidates.slice(0, limit);

    return {
      candidates: savedCandidates,
      metadata: createSearchMetadata(plan, {
        filteredOutCount,
        rawReturnedCount,
        savedCandidateCount: savedCandidates.length,
      }),
      provider: this.provider,
      query: plan.textQueries[0],
    };
  }
}
