import "server-only";

import { GooglePlacesLeadFinderProvider } from "@/lib/lead-finder/providers/google-places";
import { MockLeadFinderProvider } from "@/lib/lead-finder/providers/mock";
import { getServerEnv } from "@/lib/env";
import type {
  LeadFinderProvider,
  LeadFinderProviderStatus,
} from "@/types/lead-finder";

export function getLeadFinderProviderStatus(): LeadFinderProviderStatus {
  const env = getServerEnv();
  const googlePlacesApiKey = env.googlePlacesApiKey ? "configured" : "missing";
  const isMock = env.devMockPlaces;

  return {
    devMockPlaces: isMock ? "enabled" : "disabled",
    googlePlacesApiKey,
    mode: isMock ? "Mock Places" : "Google Places",
    ready: isMock || googlePlacesApiKey === "configured",
  };
}

export function getLeadFinderProvider(): LeadFinderProvider {
  const env = getServerEnv();

  if (env.devMockPlaces) {
    return new MockLeadFinderProvider();
  }

  if (!env.googlePlacesApiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not configured. Set DEV_MOCK_PLACES=true for local mock searches.",
    );
  }

  return new GooglePlacesLeadFinderProvider(env.googlePlacesApiKey);
}
