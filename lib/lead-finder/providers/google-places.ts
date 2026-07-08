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
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
].join(",");

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
  error?: {
    message?: string;
  };
};

type GoogleLocalizedText = {
  text?: string;
};

type GooglePlace = {
  id?: string;
  displayName?: GoogleLocalizedText;
  formattedAddress?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: GoogleLocalizedText;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
};

function sanitizeGoogleError(message: string) {
  return message.replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]");
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
    const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: Math.max(1, Math.min(input.maxResults, 20)),
      }),
    });
    const responseBody = await readGoogleResponse(response);

    if (!response.ok) {
      throw new Error(
        responseBody.error?.message
          ? `Google Places search failed: ${sanitizeGoogleError(
              responseBody.error.message,
            )}`
          : `Google Places search failed with status ${response.status}.`,
      );
    }

    const candidates: LeadCandidate[] = (responseBody.places ?? [])
      .filter((place) => place.displayName?.text)
      .map((place) => {
        const websiteUrl = place.websiteUri ?? null;

        return withLeadScore({
          provider: this.provider,
          providerPlaceId: place.id ?? null,
          businessName: place.displayName?.text ?? "Unnamed business",
          category: place.primaryTypeDisplayName?.text ?? input.niche,
          address: place.formattedAddress ?? null,
          city: input.city,
          country: input.country,
          phone: place.nationalPhoneNumber ?? null,
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
