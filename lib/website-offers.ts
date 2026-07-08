import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { OutreachStatus } from "@/types/offers";

type WebsiteOfferUpdate = {
  client_message: string | null;
  follow_up_message: string | null;
  offer_currency: string;
  offer_notes: string | null;
  offer_price_cents: number | null;
  outreach_status: OutreachStatus;
};

export async function updateWebsiteOffer(
  websiteId: string,
  values: WebsiteOfferUpdate,
  markPreviewSent: boolean,
) {
  const now = new Date().toISOString();
  const payload: Database["public"]["Tables"]["websites"]["Update"] = {
    client_message: values.client_message,
    follow_up_message: values.follow_up_message,
    offer_currency: values.offer_currency,
    offer_notes: values.offer_notes,
    offer_price_cents: values.offer_price_cents,
    outreach_status: markPreviewSent ? "sent" : values.outreach_status,
    updated_at: now,
  };

  if (markPreviewSent) {
    payload.preview_sent_at = now;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("websites")
    .update(payload)
    .eq("id", websiteId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Offer package could not be saved.");
  }

  return data;
}
