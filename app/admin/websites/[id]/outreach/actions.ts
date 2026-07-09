"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  copyOutreachMessage,
  createInboundReply,
  markOutreachMessageSent,
  saveDraftOutreachMessage,
} from "@/lib/outreach";
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

type OutboundIntent = "save" | "copy" | "sent";

export type OutboundOutreachInput = {
  body: string;
  businessId: string | null;
  channel: string;
  leadId: string | null;
  messageId: string | null;
  messageType: string;
  subject: string | null;
  websiteId: string;
};

export type InboundReplyInput = {
  body: string;
  businessId: string | null;
  leadId: string | null;
  replyCategory: string;
  websiteId: string;
};

export type OutreachActionResult = {
  copiedAt?: string | null;
  message: string;
  messageId?: string;
  sentManualAt?: string | null;
  status: "success" | "error";
};

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function validOutboundIntent(intent: string): intent is OutboundIntent {
  return intent === "save" || intent === "copy" || intent === "sent";
}

function revalidateOutreachPaths(websiteId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/outreach");
  revalidatePath(`/admin/websites/${websiteId}/outreach`);
}

export async function saveOutboundOutreachAction(
  input: OutboundOutreachInput,
  intent: string,
): Promise<OutreachActionResult> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  if (!validOutboundIntent(intent)) {
    return {
      status: "error",
      message: "Choose a valid outreach action.",
    };
  }

  if (!input.websiteId) {
    return {
      status: "error",
      message: "Website id is required.",
    };
  }

  if (!isOutreachMessageType(input.messageType)) {
    return {
      status: "error",
      message: "Choose a valid message type.",
    };
  }

  if (!isOutreachChannel(input.channel)) {
    return {
      status: "error",
      message: "Choose a valid channel.",
    };
  }

  try {
    const values = {
      body: input.body,
      businessId: compact(input.businessId),
      channel: input.channel as OutreachChannel,
      leadId: compact(input.leadId),
      messageId: compact(input.messageId),
      messageType: input.messageType as OutreachMessageType,
      subject: compact(input.subject),
      websiteId: input.websiteId,
    };
    const message =
      intent === "copy"
        ? await copyOutreachMessage(values)
        : intent === "sent"
          ? await markOutreachMessageSent(values)
          : await saveDraftOutreachMessage(values);

    revalidateOutreachPaths(input.websiteId);

    return {
      copiedAt: message.copied_at,
      message:
        intent === "copy"
          ? "Message copied and tracked."
          : intent === "sent"
            ? "Message marked sent manually."
            : "Message draft saved.",
      messageId: message.id,
      sentManualAt: message.sent_manual_at,
      status: "success",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Outreach message could not be saved.",
    };
  }
}

export async function saveInboundReplyAction(
  input: InboundReplyInput,
): Promise<OutreachActionResult> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  if (!input.websiteId) {
    return {
      status: "error",
      message: "Website id is required.",
    };
  }

  if (!isReplyCategory(input.replyCategory)) {
    return {
      status: "error",
      message: "Choose a valid reply category.",
    };
  }

  try {
    const message = await createInboundReply({
      body: input.body,
      businessId: compact(input.businessId),
      leadId: compact(input.leadId),
      replyCategory: input.replyCategory as ReplyCategory,
      websiteId: input.websiteId,
    });

    revalidateOutreachPaths(input.websiteId);

    return {
      message:
        input.replyCategory === "interested" ||
        input.replyCategory === "price_question" ||
        input.replyCategory === "needs_changes"
          ? "Reply saved and hot lead updated."
          : "Reply saved.",
      messageId: message.id,
      status: "success",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Reply could not be saved.",
    };
  }
}
