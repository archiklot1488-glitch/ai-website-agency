import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, Lead, LeadInsert, Website } from "@/types/database";
import type { LeadPriority, LeadStatus } from "@/types/deals";
import { isLeadPriority, isLeadStatus } from "@/types/deals";

type DealUpdateIntent = "save" | "contacted" | "lost" | "paid_manual";

export type LeadDeal = Lead & {
  business: Business | null;
  isHot: boolean;
  website: Website | null;
};

export type LeadDealUpdateValues = {
  adminNotes: string | null;
  conversationSummary: string | null;
  dealCurrency: string;
  dealValueCents: number | null;
  preferredPaymentMethod: string | null;
  priority: LeadPriority;
  status: LeadStatus;
};

export type HandoffLeadValues = {
  businessId: string | null;
  conversationSummary: string | null;
  dealCurrency: string;
  dealValueCents: number | null;
  email: string | null;
  message: string | null;
  name: string | null;
  phone: string | null;
  preferredPaymentMethod: string | null;
  priority: LeadPriority;
  websiteId: string | null;
  websiteSlug: string | null;
};

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeCurrency(value: string | null | undefined) {
  return (compact(value) || "USD").toUpperCase().slice(0, 12);
}

function primaryBusinessId(lead: Lead) {
  return lead.linked_business_id || lead.business_id;
}

function primaryWebsiteId(lead: Lead) {
  return lead.linked_website_id || lead.website_id;
}

function hotLead(lead: Lead) {
  return (
    lead.status === "needs_human" ||
    lead.priority === "high" ||
    lead.handoff_required
  );
}

export async function getLeadDeals(): Promise<{
  error: string | null;
  leads: LeadDeal[];
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        error: error.message,
        leads: [],
      };
    }

    const leads = data ?? [];
    const businessIds = Array.from(
      new Set(leads.map(primaryBusinessId).filter(Boolean)),
    ) as string[];
    const websiteIds = Array.from(
      new Set(leads.map(primaryWebsiteId).filter(Boolean)),
    ) as string[];
    const businessesById = new Map<string, Business>();
    const websitesById = new Map<string, Website>();

    if (businessIds.length > 0) {
      const { data: businesses, error: businessesError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessesError) {
        return {
          error: businessesError.message,
          leads: [],
        };
      }

      for (const business of businesses ?? []) {
        businessesById.set(business.id, business);
      }
    }

    if (websiteIds.length > 0) {
      const { data: websites, error: websitesError } = await supabase
        .from("websites")
        .select("*")
        .in("id", websiteIds);

      if (websitesError) {
        return {
          error: websitesError.message,
          leads: [],
        };
      }

      for (const website of websites ?? []) {
        websitesById.set(website.id, website);
      }
    }

    return {
      error: null,
      leads: leads.map((lead) => ({
        ...lead,
        business: businessesById.get(primaryBusinessId(lead) || "") ?? null,
        isHot: hotLead(lead),
        website: websitesById.get(primaryWebsiteId(lead) || "") ?? null,
      })),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Lead deals could not be loaded.",
      leads: [],
    };
  }
}

export async function updateLeadDeal(
  leadId: string,
  values: LeadDealUpdateValues,
  intent: DealUpdateIntent,
) {
  if (!isLeadStatus(values.status)) {
    throw new Error("Choose a valid lead status.");
  }

  if (!isLeadPriority(values.priority)) {
    throw new Error("Choose a valid lead priority.");
  }

  const now = new Date().toISOString();
  const statusByIntent: Record<DealUpdateIntent, LeadStatus | null> = {
    contacted: "contacted",
    lost: "lost",
    paid_manual: "paid_manual",
    save: null,
  };
  const status = statusByIntent[intent] ?? values.status;
  const payload = {
    admin_notes: values.adminNotes,
    conversation_summary: values.conversationSummary,
    deal_currency: normalizeCurrency(values.dealCurrency),
    deal_value_cents: values.dealValueCents,
    preferred_payment_method: values.preferredPaymentMethod,
    priority: values.priority,
    status,
    ...(intent === "contacted" ? { last_contacted_at: now } : {}),
  };
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", leadId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Lead deal could not be saved.");
  }

  return data;
}

export async function launchWebsiteForLead(leadId: string) {
  const supabase = createSupabaseServerClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message || "Lead could not be found.");
  }

  if (lead.status !== "paid_manual") {
    throw new Error("Mark the lead as paid manually before launching.");
  }

  const websiteId = primaryWebsiteId(lead);

  if (!websiteId) {
    throw new Error("This lead is not linked to a website.");
  }

  const now = new Date().toISOString();
  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .update({
      is_live: true,
      status: "live",
      updated_at: now,
    })
    .eq("id", websiteId)
    .select("*")
    .single();

  if (websiteError || !website) {
    throw new Error(websiteError?.message || "Website could not be launched.");
  }

  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({ status: "launched" })
    .eq("id", lead.id);

  if (updateLeadError) {
    throw new Error(updateLeadError.message);
  }

  return website;
}

async function resolveHandoffWebsite(
  values: Pick<HandoffLeadValues, "websiteId" | "websiteSlug">,
) {
  const supabase = createSupabaseServerClient();

  if (values.websiteId) {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("id", values.websiteId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Website could not be found.");
    }

    return data;
  }

  if (values.websiteSlug) {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("slug", values.websiteSlug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Website could not be found.");
    }

    return data;
  }

  return null;
}

export async function createBotHandoffLead(values: HandoffLeadValues) {
  if (!isLeadPriority(values.priority)) {
    throw new Error("Choose a valid lead priority.");
  }

  const website = await resolveHandoffWebsite(values);
  const businessId = values.businessId || website?.business_id || null;
  const payload: LeadInsert = {
    admin_notes: null,
    business_id: businessId,
    conversation_summary: values.conversationSummary,
    deal_currency: normalizeCurrency(values.dealCurrency),
    deal_value_cents: values.dealValueCents,
    email: values.email,
    handoff_required: true,
    linked_business_id: businessId,
    linked_website_id: website?.id ?? null,
    message: values.message,
    name: values.name,
    phone: values.phone,
    preferred_payment_method: values.preferredPaymentMethod,
    priority: values.priority,
    source: "bot_handoff",
    status: "needs_human",
    website_id: website?.id ?? null,
  };
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Handoff lead could not be created.");
  }

  return data;
}
