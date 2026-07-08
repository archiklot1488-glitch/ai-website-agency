import type { GeneratedWebsiteContent } from "@/types/generated-website";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type BusinessRow = {
  id: string;
  business_name: string;
  business_type: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  services: string | null;
  description: string | null;
  preferred_style: string | null;
  main_cta: string | null;
  source: string | null;
  source_place_id: string | null;
  google_maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  lead_score: number | null;
  qualification: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type WebsiteRow = {
  id: string;
  business_id: string | null;
  slug: string;
  preview_token: string;
  website_json: GeneratedWebsiteContent | null;
  status: string;
  is_live: boolean;
  offer_price_cents: number | null;
  offer_currency: string;
  offer_notes: string | null;
  preview_sent_at: string | null;
  client_message: string | null;
  follow_up_message: string | null;
  outreach_status: string;
  created_at: string;
  updated_at: string;
};

type LeadRow = {
  id: string;
  business_id: string | null;
  website_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  business_id: string | null;
  website_id: string | null;
  stripe_session_id: string | null;
  amount: number | null;
  currency: string;
  status: string | null;
  created_at: string;
};

type LeadSearchRow = {
  id: string;
  query: string;
  niche: string;
  city: string;
  country: string | null;
  provider: string;
  status: string;
  result_count: number;
  created_at: string;
};

type LeadCandidateTableRow = {
  id: string;
  lead_search_id: string | null;
  provider: string;
  provider_place_id: string | null;
  business_name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  business_status: string | null;
  has_website: boolean;
  lead_score: number;
  qualification: string | null;
  raw_data: Json | null;
  imported_business_id: string | null;
  created_at: string;
};

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      businesses: TableDefinition<
        BusinessRow,
        {
          id?: string;
          business_name: string;
          business_type?: string | null;
          city?: string | null;
          country?: string | null;
          phone?: string | null;
          email?: string | null;
          website_url?: string | null;
          services?: string | null;
          description?: string | null;
          preferred_style?: string | null;
          main_cta?: string | null;
          source?: string | null;
          source_place_id?: string | null;
          google_maps_url?: string | null;
          rating?: number | null;
          review_count?: number | null;
          lead_score?: number | null;
          qualification?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<BusinessRow>
      >;
      websites: TableDefinition<
        WebsiteRow,
        {
          id?: string;
          business_id?: string | null;
          slug: string;
          preview_token: string;
          website_json?: GeneratedWebsiteContent | null;
          status?: string;
          is_live?: boolean;
          offer_price_cents?: number | null;
          offer_currency?: string;
          offer_notes?: string | null;
          preview_sent_at?: string | null;
          client_message?: string | null;
          follow_up_message?: string | null;
          outreach_status?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<WebsiteRow>
      >;
      leads: TableDefinition<
        LeadRow,
        {
          id?: string;
          business_id?: string | null;
          website_id?: string | null;
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        },
        Partial<LeadRow>
      >;
      payments: TableDefinition<
        PaymentRow,
        {
          id?: string;
          business_id?: string | null;
          website_id?: string | null;
          stripe_session_id?: string | null;
          amount?: number | null;
          currency?: string;
          status?: string | null;
          created_at?: string;
        },
        Partial<PaymentRow>
      >;
      lead_searches: TableDefinition<
        LeadSearchRow,
        {
          id?: string;
          query: string;
          niche: string;
          city: string;
          country?: string | null;
          provider?: string;
          status?: string;
          result_count?: number;
          created_at?: string;
        },
        Partial<LeadSearchRow>
      >;
      lead_candidates: TableDefinition<
        LeadCandidateTableRow,
        {
          id?: string;
          lead_search_id?: string | null;
          provider: string;
          provider_place_id?: string | null;
          business_name: string;
          category?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          phone?: string | null;
          website_url?: string | null;
          google_maps_url?: string | null;
          rating?: number | null;
          review_count?: number | null;
          business_status?: string | null;
          has_website?: boolean;
          lead_score?: number;
          qualification?: string | null;
          raw_data?: Json | null;
          imported_business_id?: string | null;
          created_at?: string;
        },
        Partial<LeadCandidateTableRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessInsert =
  Database["public"]["Tables"]["businesses"]["Insert"];
export type Website = Database["public"]["Tables"]["websites"]["Row"];
export type WebsiteInsert =
  Database["public"]["Tables"]["websites"]["Insert"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadSearch =
  Database["public"]["Tables"]["lead_searches"]["Row"];
export type LeadSearchInsert =
  Database["public"]["Tables"]["lead_searches"]["Insert"];
export type LeadCandidateRow =
  Database["public"]["Tables"]["lead_candidates"]["Row"];
export type LeadCandidateInsert =
  Database["public"]["Tables"]["lead_candidates"]["Insert"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
