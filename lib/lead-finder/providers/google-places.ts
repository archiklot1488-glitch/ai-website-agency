import "server-only";

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

function humanizeType(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function stablePlaceKey(place: GooglePlace, fallbackIndex: number) {
  if (place.id) {
    return `id:${place.id}`;
  }

  return [
    "name",
    place.displayName?.text ?? "unknown",
    place.formattedAddress ?? fallbackIndex,
  ].join(":");
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

export class GooglePlacesLeadFinderProvider implements LeadFinderProvider {
  readonly provider = "google_places";

  constructor(private readonly apiKey: string) {}

  async searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> {
    const query = `${input.niche} in ${input.city}${
      input.country ? `, ${input.country}` : ""
    }`;
    const body: Record<string, string | number | boolean> = {
      includePureServiceAreaBusinesses: true,
      pageSize: maxResults(input.maxResults),
      textQuery: query,
    };

    if (input.includedType) {
      body.includedType = input.includedType;
      body.strictTypeFiltering = false;
    }

    if (input.country && /^[a-z]{2}$/i.test(input.country)) {
      body.regionCode = input.country.toUpperCase();
    }

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

    const seen = new Set<string>();
    const candidates: LeadCandidate[] = (responseBody.places ?? [])
      .filter((place) => place.displayName?.text)
      .filter((place, index) => {
        const key = stablePlaceKey(place, index);

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((place) => {
        const websiteUrl = place.websiteUri ?? null;
        const primaryType = humanizeType(place.primaryType);
        const fallbackType = humanizeType(place.types?.[0]);

        return withLeadScore({
          provider: this.provider,
          providerPlaceId: place.id ?? null,
          businessName: place.displayName?.text ?? "Unnamed business",
          category: primaryType ?? fallbackType ?? input.niche,
          address: place.formattedAddress ?? null,
          city: input.city,
          country: input.country,
          phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
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
        });
      });

    return {
      provider: this.provider,
      query,
      candidates,
    };
  }
}
