import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLeadDeals, type LeadDeal } from "@/lib/deals";
import { getWebsiteForAdminEdit } from "@/lib/websites";
import type {
  Business,
  Lead,
  OutreachMessage,
  OutreachMessageInsert,
  Website,
} from "@/types/database";
import type {
  OutreachChannel,
  OutreachMessageType,
  ReplyCategory,
} from "@/types/outreach";
import {
  isOutreachChannel,
  isOutreachMessageType,
  isReplyCategory,
} from "@/types/outreach";
import type { RenderableWebsite } from "@/types/website-rendering";

export type OutreachWebsiteSummary = {
  business: Business | null;
  latestMessage: OutreachMessage | null;
  website: Website;
};

export type WebsiteOutreachWorkspace =
  | {
      status: "ok";
      business: Business | null;
      leads: Lead[];
      messages: OutreachMessage[];
      website: RenderableWebsite;
    }
  | {
      status: "not-found";
    }
  | {
      status: "invalid";
      message: string;
    };

export type OutreachMessageSaveValues = {
  body: string;
  businessId: string | null;
  channel: OutreachChannel;
  leadId: string | null;
  messageId: string | null;
  messageType: OutreachMessageType;
  subject: string | null;
  websiteId: string;
};

export type InboundReplyValues = {
  body: string;
  businessId: string | null;
  leadId: string | null;
  replyCategory: ReplyCategory;
  websiteId: string;
};

function primaryBusinessId(lead: Lead) {
  return lead.linked_business_id || lead.business_id;
}

function primaryWebsiteId(lead: Lead) {
  return lead.linked_website_id || lead.website_id;
}

function messagePriority(message: OutreachMessage) {
  if (message.status === "sent_manual") {
    return 4;
  }

  if (message.status === "copied") {
    return 3;
  }

  if (message.status === "received_reply") {
    return 2;
  }

  return 1;
}

function latestMessageForWebsite(
  messages: OutreachMessage[],
  websiteId: string,
) {
  return messages
    .filter((message) => message.website_id === websiteId)
    .sort((left, right) => {
      const statusDiff = messagePriority(right) - messagePriority(left);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      return (
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );
    })[0] ?? null;
}

export async function getOutreachDashboardData(): Promise<{
  error: string | null;
  leads: LeadDeal[];
  websites: OutreachWebsiteSummary[];
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: websites, error: websitesError } = await supabase
      .from("websites")
      .select("*")
      .in("status", ["preview", "live"])
      .order("updated_at", { ascending: false })
      .limit(12);

    if (websitesError) {
      return {
        error: websitesError.message,
        leads: [],
        websites: [],
      };
    }

    const websiteRows = websites ?? [];
    const businessIds = Array.from(
      new Set(websiteRows.map((website) => website.business_id).filter(Boolean)),
    ) as string[];
    const websiteIds = websiteRows.map((website) => website.id);
    const businessesById = new Map<string, Business>();

    if (businessIds.length > 0) {
      const { data: businesses, error: businessesError } = await supabase
        .from("businesses")
        .select("*")
        .in("id", businessIds);

      if (businessesError) {
        return {
          error: businessesError.message,
          leads: [],
          websites: [],
        };
      }

      for (const business of businesses ?? []) {
        businessesById.set(business.id, business);
      }
    }

    const messagesByWebsiteId = new Map<string, OutreachMessage[]>();

    if (websiteIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from("outreach_messages")
        .select("*")
        .in("website_id", websiteIds)
        .order("updated_at", { ascending: false });

      if (messagesError) {
        return {
          error: messagesError.message,
          leads: [],
          websites: [],
        };
      }

      for (const message of messages ?? []) {
        if (!message.website_id) {
          continue;
        }

        const existing = messagesByWebsiteId.get(message.website_id) ?? [];
        existing.push(message);
        messagesByWebsiteId.set(message.website_id, existing);
      }
    }

    const { leads, error: leadsError } = await getLeadDeals();

    if (leadsError) {
      return {
        error: leadsError,
        leads: [],
        websites: [],
      };
    }

    return {
      error: null,
      leads: leads
        .filter((lead) =>
          [
            "new",
            "interested",
            "needs_human",
            "contacted",
            "negotiating",
          ].includes(lead.status),
        )
        .slice(0, 10),
      websites: websiteRows.map((website) => ({
        business: website.business_id
          ? businessesById.get(website.business_id) ?? null
          : null,
        latestMessage: latestMessageForWebsite(
          messagesByWebsiteId.get(website.id) ?? [],
          website.id,
        ),
        website,
      })),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Outreach workspace could not be loaded.",
      leads: [],
      websites: [],
    };
  }
}

export async function getWebsiteOutreachWorkspace(
  websiteId: string,
): Promise<WebsiteOutreachWorkspace> {
  const websiteResult = await getWebsiteForAdminEdit(websiteId);

  if (websiteResult.status !== "ok") {
    return websiteResult;
  }

  const supabase = createSupabaseServerClient();
  const { data: messages, error: messagesError } = await supabase
    .from("outreach_messages")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .or(`website_id.eq.${websiteId},linked_website_id.eq.${websiteId}`)
    .order("created_at", { ascending: false });

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  return {
    status: "ok",
    business: websiteResult.business ?? null,
    leads: leads ?? [],
    messages: messages ?? [],
    website: websiteResult.website,
  };
}

async function upsertOutreachMessage(
  values: OutreachMessageSaveValues,
  status: "draft" | "copied" | "sent_manual",
) {
  if (!isOutreachMessageType(values.messageType)) {
    throw new Error("Choose a valid message type.");
  }

  if (!isOutreachChannel(values.channel)) {
    throw new Error("Choose a valid channel.");
  }

  if (!values.body.trim()) {
    throw new Error("Message body is required.");
  }

  const now = new Date().toISOString();
  const basePayload = {
    body: values.body.trim(),
    business_id: values.businessId,
    channel: values.channel,
    direction: "outbound",
    lead_id: values.leadId,
    message_type: values.messageType,
    status,
    subject: values.subject?.trim() || null,
    updated_at: now,
    website_id: values.websiteId,
    ...(status === "copied" ? { copied_at: now } : {}),
    ...(status === "sent_manual" ? { sent_manual_at: now } : {}),
  };
  const supabase = createSupabaseServerClient();

  if (values.messageId) {
    const { data, error } = await supabase
      .from("outreach_messages")
      .update(basePayload)
      .eq("id", values.messageId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Outreach message could not be saved.");
    }

    return data;
  }

  const insertPayload: OutreachMessageInsert = {
    ...basePayload,
    message_type: values.messageType,
    body: values.body.trim(),
  };
  const { data, error } = await supabase
    .from("outreach_messages")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Outreach message could not be saved.");
  }

  return data;
}

async function updateWebsiteOutreachStatus(
  websiteId: string,
  messageType: OutreachMessageType,
  markSent: boolean,
) {
  const nextStatus =
    messageType === "initial_preview"
      ? "sent"
      : messageType === "follow_up_1" || messageType === "follow_up_2"
        ? "followed_up"
        : null;

  if (!nextStatus) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("websites")
    .update({
      outreach_status: nextStatus,
      ...(markSent && messageType === "initial_preview"
        ? { preview_sent_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", websiteId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveDraftOutreachMessage(
  values: OutreachMessageSaveValues,
) {
  return upsertOutreachMessage(values, "draft");
}

export async function copyOutreachMessage(values: OutreachMessageSaveValues) {
  const message = await upsertOutreachMessage(values, "copied");

  if (values.messageType === "initial_preview") {
    await updateWebsiteOutreachStatus(values.websiteId, values.messageType, false);
  }

  return message;
}

export async function markOutreachMessageSent(values: OutreachMessageSaveValues) {
  const message = await upsertOutreachMessage(values, "sent_manual");
  await updateWebsiteOutreachStatus(values.websiteId, values.messageType, true);

  return message;
}

async function findReplyLead(websiteId: string, leadId: string | null) {
  const supabase = createSupabaseServerClient();

  if (leadId) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .or(`website_id.eq.${websiteId},linked_website_id.eq.${websiteId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

function replyShouldCreateHotLead(category: ReplyCategory) {
  return (
    category === "interested" ||
    category === "price_question" ||
    category === "needs_changes"
  );
}

export async function createInboundReply(values: InboundReplyValues) {
  if (!isReplyCategory(values.replyCategory)) {
    throw new Error("Choose a valid reply category.");
  }

  if (!values.body.trim()) {
    throw new Error("Reply body is required.");
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: message, error: messageError } = await supabase
    .from("outreach_messages")
    .insert({
      body: values.body.trim(),
      business_id: values.businessId,
      channel: "manual",
      direction: "inbound",
      lead_id: values.leadId,
      message_type: "custom",
      status: "received_reply",
      subject: `Client reply: ${values.replyCategory.replaceAll("_", " ")}`,
      website_id: values.websiteId,
    })
    .select("*")
    .single();

  if (messageError || !message) {
    throw new Error(messageError?.message || "Reply could not be saved.");
  }

  if (!replyShouldCreateHotLead(values.replyCategory)) {
    return message;
  }

  const existingLead = await findReplyLead(values.websiteId, values.leadId);
  const nextStatus = values.replyCategory === "interested" ? "interested" : "needs_human";

  if (existingLead) {
    const { error } = await supabase
      .from("leads")
      .update({
        conversation_summary: values.body.trim(),
        handoff_required: true,
        last_contacted_at: now,
        priority: "high",
        source: "manual_reply",
        status: nextStatus,
      })
      .eq("id", existingLead.id);

    if (error) {
      throw new Error(error.message);
    }

    return message;
  }

  const websiteResult = await getWebsiteForAdminEdit(values.websiteId);
  const website =
    websiteResult.status === "ok" ? websiteResult.website : null;
  const businessId = values.businessId || website?.business_id || null;
  const { error } = await supabase.from("leads").insert({
    business_id: businessId,
    conversation_summary: values.body.trim(),
    handoff_required: true,
    linked_business_id: businessId,
    linked_website_id: values.websiteId,
    message: values.body.trim(),
    priority: "high",
    source: "manual_reply",
    status: nextStatus,
    website_id: values.websiteId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return message;
}
