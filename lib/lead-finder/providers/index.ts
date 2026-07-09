import "server-only";

import { GooglePlacesLeadFinderProvider } from "@/lib/lead-finder/providers/google-places";
import { MockLeadFinderProvider } from "@/lib/lead-finder/providers/mock";
import type { LeadFinderProvider } from "@/types/lead-finder";

function isMockPlacesEnabled() {
  return process.env.DEV_MOCK_PLACES?.trim().toLowerCase() === "true";
}

export function getLeadFinderProvider(): LeadFinderProvider {
  if (isMockPlacesEnabled()) {
    return new MockLeadFinderProvider();
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not configured. Set DEV_MOCK_PLACES=true for local mock searches.",
    );
  }

  return new GooglePlacesLeadFinderProvider(apiKey);
}
