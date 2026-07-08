import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadInsert } from "@/types/database";

export type LeadFormValues = {
  websiteId: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
};

export async function createLeadForLiveWebsite(values: LeadFormValues) {
  const supabase = createSupabaseServerClient();

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, business_id, status")
    .eq("id", values.websiteId)
    .single();

  if (websiteError || !website) {
    throw new Error(websiteError?.message || "Website could not be found.");
  }

  if (website.status !== "live") {
    throw new Error("This contact form is only available on live websites.");
  }

  const payload: LeadInsert = {
    business_id: website.business_id,
    website_id: website.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    message: values.message,
    source: "live_site",
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
