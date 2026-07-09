import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSDRAnalyzer, isHotSDRIntent } from "@/lib/sdr/analyzer";
import type {
  Business,
  Json,
  Lead,
  SDRConversation,
  SDRConversationInsert,
  SDRMessage,
  Website,
} from "@/types/database";
import type {
  SDRAnalysisResult,
  SDRChannel,
  SDRConversationWithRelations,
} from "@/types/sdr";
import { isSDRChannel, isSDRIntent } from "@/types/sdr";

export type ProcessSDRMessageInput = {
  businessId?: string | null;
  channel?: string | null;
  clientEmail?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  conversationId?: string | null;
  leadId?: string | null;
  message: string;
  outreachMessageId?: string | null;
  websiteId?: string | null;
  websiteSlug?: string | null;
};

export type SDRConversationDetail =
  | {
      status: "ok";
      business: Business | null;
      conversation: SDRConversation;
      lead: Lead | null;
      messages: SDRMessage[];
      website: Website | null;
    }
  | {
      status: "not-found";
    };

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeChannel(value: string | null | undefined): SDRChannel {
  const channel = compact(value) || "manual";

  return isSDRChannel(channel) ? channel : "manual";
}

function analysisJson(analysis: SDRAnalysisResult): Json {
  return JSON.parse(JSON.stringify(analysis)) as Json;
}

async function loadWebsite(values: {
  websiteId?: string | null;
  websiteSlug?: string | null;
}) {
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

    return data ?? null;
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

    return data ?? null;
  }

  return null;
}

async function loadBusiness(businessId: string | null | undefined) {
  if (!businessId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function loadLead(leadId: string | null | undefined) {
  if (!leadId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function findOpenConversationForWebsite(websiteId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sdr_conversations")
    .select("*")
    .eq("website_id", websiteId)
    .in("status", ["open", "needs_human"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function loadConversation(conversationId: string | null | undefined) {
  if (!conversationId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sdr_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("SDR conversation could not be found.");
  }

  return data;
}

async function createConversation(values: {
  businessId: string | null;
  channel: SDRChannel;
  clientEmail: string | null;
  clientName: string | null;
  clientPhone: string | null;
  leadId: string | null;
  outreachMessageId: string | null;
  websiteId: string | null;
}) {
  const supabase = createSupabaseServerClient();
  const payload: SDRConversationInsert = {
    business_id: values.businessId,
    channel: values.channel,
    client_email: values.clientEmail,
    client_name: values.clientName,
    client_phone: values.clientPhone,
    lead_id: values.leadId,
    outreach_message_id: values.outreachMessageId,
    status: "open",
    website_id: values.websiteId,
  };
  const { data, error } = await supabase
    .from("sdr_conversations")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "SDR conversation could not be created.");
  }

  return data;
}

async function ensureConversation(values: ProcessSDRMessageInput) {
  const explicitConversation = await loadConversation(values.conversationId);
  const website =
    explicitConversation?.website_id
      ? await loadWebsite({ websiteId: explicitConversation.website_id })
      : await loadWebsite({
          websiteId: compact(values.websiteId),
          websiteSlug: compact(values.websiteSlug),
        });

  if (explicitConversation) {
    return {
      conversation: explicitConversation,
      website,
    };
  }

  if (website) {
    const openConversation = await findOpenConversationForWebsite(website.id);

    if (openConversation) {
      return {
        conversation: openConversation,
        website,
      };
    }
  }

  const businessId = compact(values.businessId) || website?.business_id || null;
  const conversation = await createConversation({
    businessId,
    channel: normalizeChannel(values.channel),
    clientEmail: compact(values.clientEmail),
    clientName: compact(values.clientName),
    clientPhone: compact(values.clientPhone),
    leadId: compact(values.leadId),
    outreachMessageId: compact(values.outreachMessageId),
    websiteId: website?.id ?? compact(values.websiteId),
  });

  return {
    conversation,
    website,
  };
}

async function previousMessages(conversationId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sdr_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function findMatchingLead(values: {
  businessId: string | null;
  email: string | null;
  websiteId: string | null;
}) {
  if (!values.email) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  if (values.websiteId) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", values.email)
      .or(`website_id.eq.${values.websiteId},linked_website_id.eq.${values.websiteId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data;
    }
  }

  if (values.businessId) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("email", values.email)
      .or(
        `business_id.eq.${values.businessId},linked_business_id.eq.${values.businessId}`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ?? null;
  }

  return null;
}

async function createOrUpdateHotLead(values: {
  analysis: SDRAnalysisResult;
  businessId: string | null;
  clientEmail: string | null;
  clientName: string | null;
  clientPhone: string | null;
  conversation: SDRConversation;
  message: string;
  websiteId: string | null;
}) {
  if (!isHotSDRIntent(values.analysis.intent)) {
    return values.conversation.lead_id;
  }

  const supabase = createSupabaseServerClient();
  const existingLead =
    (await loadLead(values.conversation.lead_id)) ||
    (await findMatchingLead({
      businessId: values.businessId,
      email: values.clientEmail,
      websiteId: values.websiteId,
    }));
  const payload = {
    admin_notes: `AI SDR detected intent: ${values.analysis.intent}. ${values.analysis.reasoning}`,
    business_id: values.businessId,
    conversation_summary: values.analysis.summary,
    email: values.clientEmail,
    handoff_required: true,
    linked_business_id: values.businessId,
    linked_website_id: values.websiteId,
    message: values.message,
    name: values.clientName,
    phone: values.clientPhone,
    priority: "high",
    source: "ai_sdr_analysis",
    status: values.analysis.intent === "interested" ? "interested" : "needs_human",
    website_id: values.websiteId,
  };

  if (existingLead) {
    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", existingLead.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Hot lead could not be updated.");
    }

    return data.id;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Hot lead could not be created.");
  }

  return data.id;
}

export async function processSDRInboundMessage(values: ProcessSDRMessageInput) {
  const messageBody = compact(values.message);

  if (!messageBody) {
    throw new Error("Message is required.");
  }

  const { conversation, website } = await ensureConversation(values);
  const businessId =
    conversation.business_id || compact(values.businessId) || website?.business_id || null;
  const business = await loadBusiness(businessId);
  const messages = await previousMessages(conversation.id);
  const analyzer = getSDRAnalyzer();
  const analysis = await analyzer.analyze({
    business,
    conversation,
    message: messageBody,
    previousMessages: messages,
    website,
  });
  const supabase = createSupabaseServerClient();
  const { data: message, error: messageError } = await supabase
    .from("sdr_messages")
    .insert({
      analysis: analysisJson(analysis),
      body: messageBody,
      conversation_id: conversation.id,
      detected_intent: analysis.intent,
      direction: "inbound",
      sender_role: "client",
      suggested_reply: analysis.reply.body,
    })
    .select("*")
    .single();

  if (messageError || !message) {
    throw new Error(messageError?.message || "SDR message could not be saved.");
  }

  const clientEmail = compact(values.clientEmail) || conversation.client_email;
  const clientName = compact(values.clientName) || conversation.client_name;
  const clientPhone = compact(values.clientPhone) || conversation.client_phone;
  const websiteId = website?.id ?? conversation.website_id;
  const leadId = await createOrUpdateHotLead({
    analysis,
    businessId,
    clientEmail,
    clientName,
    clientPhone,
    conversation,
    message: messageBody,
    websiteId,
  });
  const nextLeadId = leadId || conversation.lead_id;
  const { data: updatedConversation, error: updateError } = await supabase
    .from("sdr_conversations")
    .update({
      business_id: businessId,
      client_email: clientEmail,
      client_name: clientName,
      client_phone: clientPhone,
      conversation_summary: analysis.summary,
      detected_intent: analysis.intent,
      handoff_required: analysis.handoffRequired,
      last_message_at: new Date().toISOString(),
      lead_id: nextLeadId,
      status: analysis.handoffRequired ? "needs_human" : conversation.status,
      website_id: websiteId,
    })
    .eq("id", conversation.id)
    .select("*")
    .single();

  if (updateError || !updatedConversation) {
    throw new Error(updateError?.message || "SDR conversation could not be updated.");
  }

  return {
    analysis,
    conversation: updatedConversation,
    leadId: nextLeadId,
    message,
  };
}

export async function getSDRConversations(): Promise<{
  conversations: SDRConversationWithRelations[];
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("sdr_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return { conversations: [], error: error.message };
    }

    const conversations = data ?? [];
    const businessIds = Array.from(
      new Set(conversations.map((item) => item.business_id).filter(Boolean)),
    ) as string[];
    const websiteIds = Array.from(
      new Set(conversations.map((item) => item.website_id).filter(Boolean)),
    ) as string[];
    const leadIds = Array.from(
      new Set(conversations.map((item) => item.lead_id).filter(Boolean)),
    ) as string[];
    const conversationIds = conversations.map((item) => item.id);
    const businessesById = new Map<string, Business>();
    const websitesById = new Map<string, Website>();
    const leadsById = new Map<string, Lead>();
    const latestMessageByConversationId = new Map<string, SDRMessage>();

    if (businessIds.length > 0) {
      const { data: businesses, error: businessesError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessesError) {
        return { conversations: [], error: businessesError.message };
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
        return { conversations: [], error: websitesError.message };
      }

      for (const website of websites ?? []) {
        websitesById.set(website.id, website);
      }
    }

    if (leadIds.length > 0) {
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .in("id", leadIds);

      if (leadsError) {
        return { conversations: [], error: leadsError.message };
      }

      for (const lead of leads ?? []) {
        leadsById.set(lead.id, lead);
      }
    }

    if (conversationIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from("sdr_messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) {
        return { conversations: [], error: messagesError.message };
      }

      for (const message of messages ?? []) {
        if (!latestMessageByConversationId.has(message.conversation_id)) {
          latestMessageByConversationId.set(message.conversation_id, message);
        }
      }
    }

    return {
      error: null,
      conversations: conversations.map((conversation) => ({
        ...conversation,
        business: conversation.business_id
          ? businessesById.get(conversation.business_id) ?? null
          : null,
        lead: conversation.lead_id
          ? leadsById.get(conversation.lead_id) ?? null
          : null,
        latestMessage:
          latestMessageByConversationId.get(conversation.id) ?? null,
        website: conversation.website_id
          ? websitesById.get(conversation.website_id) ?? null
          : null,
      })),
    };
  } catch (error) {
    return {
      conversations: [],
      error:
        error instanceof Error
          ? error.message
          : "SDR conversations could not be loaded.",
    };
  }
}

export async function getSDRConversationDetail(
  conversationId: string,
): Promise<SDRConversationDetail> {
  const conversation = await loadConversation(conversationId);

  if (!conversation) {
    return { status: "not-found" };
  }

  const [business, lead, website, messages] = await Promise.all([
    loadBusiness(conversation.business_id),
    loadLead(conversation.lead_id),
    loadWebsite({ websiteId: conversation.website_id }),
    previousMessages(conversation.id),
  ]);

  return {
    status: "ok",
    business,
    conversation,
    lead,
    messages,
    website,
  };
}

export async function createOrOpenSDRConversationForWebsite(websiteId: string) {
  const website = await loadWebsite({ websiteId });

  if (!website) {
    throw new Error("Website could not be found.");
  }

  const existing = await findOpenConversationForWebsite(website.id);

  if (existing) {
    return existing;
  }

  return createConversation({
    businessId: website.business_id,
    channel: "manual",
    clientEmail: null,
    clientName: null,
    clientPhone: null,
    leadId: null,
    outreachMessageId: null,
    websiteId: website.id,
  });
}

export async function updateSDRConversationStatus(
  conversationId: string,
  status: "needs_human" | "closed",
) {
  const supabase = createSupabaseServerClient();
  const payload =
    status === "needs_human"
      ? {
          handoff_required: true,
          status,
        }
      : {
          status,
        };
  const { data, error } = await supabase
    .from("sdr_conversations")
    .update(payload)
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "SDR conversation could not be updated.");
  }

  return data;
}

export async function createOrUpdateHotLeadForConversation(conversationId: string) {
  const detail = await getSDRConversationDetail(conversationId);

  if (detail.status !== "ok") {
    throw new Error("SDR conversation could not be found.");
  }

  const latestInbound =
    [...detail.messages]
      .reverse()
      .find((message) => message.direction === "inbound") ?? null;
  const detectedIntent = detail.conversation.detected_intent;
  const intent =
    detectedIntent &&
    isSDRIntent(detectedIntent) &&
    isHotSDRIntent(detectedIntent)
      ? detectedIntent
      : "interested";
  const analysis: SDRAnalysisResult = {
    confidence: 1,
    handoffRequired: true,
    intent,
    reasoning: "Admin manually requested hot lead creation from SDR conversation.",
    reply: {
      body:
        latestInbound?.suggested_reply ||
        "Suggested reply should be reviewed by the admin before sending.",
    },
    summary:
      detail.conversation.conversation_summary ||
      latestInbound?.body ||
      "Manual SDR handoff requested.",
  };
  const leadId = await createOrUpdateHotLead({
    analysis,
    businessId: detail.conversation.business_id,
    clientEmail: detail.conversation.client_email,
    clientName: detail.conversation.client_name,
    clientPhone: detail.conversation.client_phone,
    conversation: detail.conversation,
    message: latestInbound?.body || analysis.summary,
    websiteId: detail.conversation.website_id,
  });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sdr_conversations")
    .update({
      handoff_required: true,
      lead_id: leadId,
      status: "needs_human",
    })
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "SDR conversation could not be updated.");
  }

  return data;
}
