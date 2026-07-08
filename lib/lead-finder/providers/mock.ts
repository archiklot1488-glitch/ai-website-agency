import "server-only";

import { withLeadScore } from "@/lib/lead-finder/scoring";
import type {
  LeadCandidate,
  LeadFinderProvider,
  LeadSearchInput,
  LeadSearchResult,
} from "@/types/lead-finder";

const namePrefixes = [
  "Bright",
  "Summit",
  "Neighborhood",
  "Cedar",
  "Bluebonnet",
  "Capital",
  "Friendly",
  "Reliable",
  "Cornerstone",
  "Lone Star",
];

const nameSuffixes = [
  "Pros",
  "Co.",
  "Studio",
  "Services",
  "Group",
  "Works",
  "Solutions",
  "Collective",
];

function hashValue(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 33 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function phoneForIndex(index: number) {
  if (index % 5 === 2) {
    return null;
  }

  return `(512) 555-${String(1200 + index * 137).slice(-4)}`;
}

function websiteForIndex(name: string, index: number) {
  if (index % 3 === 0 || index % 5 === 1) {
    return null;
  }

  return `https://www.${normalizeSlug(name)}.example.com`;
}

export class MockLeadFinderProvider implements LeadFinderProvider {
  readonly provider = "mock_places";

  async searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult> {
    const query = `${input.niche} in ${input.city}${
      input.country ? `, ${input.country}` : ""
    }`;
    const seed = hashValue(query);
    const maxResults = Math.max(1, Math.min(input.maxResults, 20));
    const candidates: LeadCandidate[] = Array.from(
      { length: maxResults },
      (_, index) => {
        const prefix = namePrefixes[(seed + index) % namePrefixes.length];
        const suffix = nameSuffixes[(seed + index * 3) % nameSuffixes.length];
        const businessName = `${prefix} ${titleCase(input.niche)} ${suffix}`;
        const reviewCount =
          index % 4 === 0 ? 4 + index : 18 + ((seed + index * 11) % 180);
        const rating =
          index % 6 === 4 ? 3.4 : Number((4 + ((seed + index) % 10) / 10).toFixed(1));
        const businessStatus = index % 9 === 7 ? "CLOSED_TEMPORARILY" : "OPERATIONAL";
        const websiteUrl = websiteForIndex(businessName, index);
        const address =
          index % 8 === 5 ? null : `${100 + index * 17} Main St, ${input.city}`;

        return withLeadScore({
          provider: this.provider,
          providerPlaceId: `mock_${normalizeSlug(input.city)}_${normalizeSlug(
            input.niche,
          )}_${index + 1}`,
          businessName,
          category: titleCase(input.niche),
          address,
          city: input.city,
          country: input.country,
          phone: phoneForIndex(index),
          websiteUrl,
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(
            `${businessName} ${input.city}`,
          )}`,
          rating,
          reviewCount,
          businessStatus,
          hasWebsite: Boolean(websiteUrl),
          rawData: {
            mock: true,
            seed,
            index,
          },
        });
      },
    );

    return {
      provider: this.provider,
      query,
      candidates,
    };
  }
}
