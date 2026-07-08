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
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
