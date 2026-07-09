import type { Json } from "@/types/database";

export type LeadSearchInput = {
  niche: string;
  city: string;
  country: string | null;
  includedType?: string | null;
  maxResults: number;
};

export type LeadQualification = {
  leadScore: number;
  qualification: string;
  priority: "hot" | "warm" | "low" | "skip";
  signals: string[];
};

export type LeadCandidate = {
  id?: string;
  leadSearchId?: string | null;
  provider: string;
  providerPlaceId: string | null;
  businessName: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  businessStatus: string | null;
  hasWebsite: boolean;
  leadScore: number;
  qualification: string | null;
  rawData: Json | null;
  signals?: string[];
  importedBusinessId?: string | null;
};

export type LeadSearchResult = {
  provider: string;
  query: string;
  candidates: LeadCandidate[];
};

export type LeadFinderProviderStatus = {
  devMockPlaces: "enabled" | "disabled";
  googlePlacesApiKey: "configured" | "missing";
  mode: "Mock Places" | "Google Places";
  ready: boolean;
};

export type LeadFinderProvider = {
  readonly provider: string;
  searchBusinesses(input: LeadSearchInput): Promise<LeadSearchResult>;
};
