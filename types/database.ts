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
  status: string;
  priority: string;
  conversation_summary: string | null;
  last_contacted_at: string | null;
  admin_notes: string | null;
  deal_value_cents: number | null;
  deal_currency: string;
  preferred_payment_method: string | null;
  handoff_required: boolean;
  linked_website_id: string | null;
  linked_business_id: string | null;
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
  metadata: Json | null;
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

type OutreachMessageRow = {
  id: string;
  business_id: string | null;
  website_id: string | null;
  lead_id: string | null;
  message_type: string;
  channel: string;
  direction: string;
  subject: string | null;
  body: string;
  status: string;
  copied_at: string | null;
  sent_manual_at: string | null;
  created_at: string;
  updated_at: string;
};

type SDRConversationRow = {
  id: string;
  business_id: string | null;
  website_id: string | null;
  lead_id: string | null;
  outreach_message_id: string | null;
  channel: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  conversation_summary: string | null;
  detected_intent: string | null;
  handoff_required: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type SDRMessageRow = {
  id: string;
  conversation_id: string;
  direction: string;
  sender_role: string;
  body: string;
  detected_intent: string | null;
  suggested_reply: string | null;
  analysis: Json | null;
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
          status?: string;
          priority?: string;
          conversation_summary?: string | null;
          last_contacted_at?: string | null;
          admin_notes?: string | null;
          deal_value_cents?: number | null;
          deal_currency?: string;
          preferred_payment_method?: string | null;
          handoff_required?: boolean;
          linked_website_id?: string | null;
          linked_business_id?: string | null;
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
          metadata?: Json | null;
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
      outreach_messages: TableDefinition<
        OutreachMessageRow,
        {
          id?: string;
          business_id?: string | null;
          website_id?: string | null;
          lead_id?: string | null;
          message_type: string;
          channel?: string;
          direction?: string;
          subject?: string | null;
          body: string;
          status?: string;
          copied_at?: string | null;
          sent_manual_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<OutreachMessageRow>
      >;
      sdr_conversations: TableDefinition<
        SDRConversationRow,
        {
          id?: string;
          business_id?: string | null;
          website_id?: string | null;
          lead_id?: string | null;
          outreach_message_id?: string | null;
          channel?: string;
          status?: string;
          client_name?: string | null;
          client_email?: string | null;
          client_phone?: string | null;
          conversation_summary?: string | null;
          detected_intent?: string | null;
          handoff_required?: boolean;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<SDRConversationRow>
      >;
      sdr_messages: TableDefinition<
        SDRMessageRow,
        {
          id?: string;
          conversation_id: string;
          direction: string;
          sender_role?: string;
          body: string;
          detected_intent?: string | null;
          suggested_reply?: string | null;
          analysis?: Json | null;
          created_at?: string;
        },
        Partial<SDRMessageRow>
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
export type OutreachMessage =
  Database["public"]["Tables"]["outreach_messages"]["Row"];
export type OutreachMessageInsert =
  Database["public"]["Tables"]["outreach_messages"]["Insert"];
export type SDRConversation =
  Database["public"]["Tables"]["sdr_conversations"]["Row"];
export type SDRConversationInsert =
  Database["public"]["Tables"]["sdr_conversations"]["Insert"];
export type SDRMessage = Database["public"]["Tables"]["sdr_messages"]["Row"];
export type SDRMessageInsert =
  Database["public"]["Tables"]["sdr_messages"]["Insert"];
