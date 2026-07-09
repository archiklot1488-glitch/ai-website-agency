"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createOrUpdateHotLeadForConversation,
  processSDRInboundMessage,
  updateSDRConversationStatus,
} from "@/lib/sdr/conversations";
import type { ActionState } from "@/types/actions";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function revalidateSDR(conversationId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/sdr");

  if (conversationId) {
    revalidatePath(`/admin/sdr/${conversationId}`);
  }
}

export async function startSDRConversationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const message = valueFromForm(formData, "message");

  if (!message) {
    return {
      status: "error",
      message: "Client message is required.",
    };
  }

  let redirectTo: string;

  try {
    const result = await processSDRInboundMessage({
      businessId: valueFromForm(formData, "business_id"),
      channel: valueFromForm(formData, "channel"),
      clientEmail: valueFromForm(formData, "client_email"),
      clientName: valueFromForm(formData, "client_name"),
      clientPhone: valueFromForm(formData, "client_phone"),
      leadId: valueFromForm(formData, "lead_id"),
      message,
      websiteId: valueFromForm(formData, "website_id"),
      websiteSlug: valueFromForm(formData, "website_slug"),
    });

    revalidateSDR(result.conversation.id);
    redirectTo = `/admin/sdr/${result.conversation.id}`;
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "SDR conversation could not be started.",
    };
  }

  redirect(redirectTo);
}

export async function addSDRInboundMessageAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const conversationId = valueFromForm(formData, "conversation_id");
  const message = valueFromForm(formData, "message");

  if (!conversationId || !message) {
    return {
      status: "error",
      message: "Conversation id and message are required.",
    };
  }

  try {
    const result = await processSDRInboundMessage({
      clientEmail: valueFromForm(formData, "client_email"),
      clientName: valueFromForm(formData, "client_name"),
      clientPhone: valueFromForm(formData, "client_phone"),
      conversationId,
      message,
    });

    revalidateSDR(conversationId);

    return {
      status: "success",
      message: `Analyzed as ${result.analysis.intent}. Suggested reply updated.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Message could not be analyzed.",
    };
  }
}

export async function markSDRNeedsHumanAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const conversationId = valueFromForm(formData, "conversation_id");

  if (!conversationId) {
    return {
      status: "error",
      message: "Conversation id is required.",
    };
  }

  try {
    await updateSDRConversationStatus(conversationId, "needs_human");
    revalidateSDR(conversationId);

    return {
      status: "success",
      message: "Conversation marked needs human.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Conversation could not be updated.",
    };
  }
}

export async function closeSDRConversationAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const conversationId = valueFromForm(formData, "conversation_id");

  if (!conversationId) {
    return {
      status: "error",
      message: "Conversation id is required.",
    };
  }

  try {
    await updateSDRConversationStatus(conversationId, "closed");
    revalidateSDR(conversationId);

    return {
      status: "success",
      message: "Conversation closed.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Conversation could not be closed.",
    };
  }
}

export async function createSDRHotLeadAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return {
      status: "error",
      message: "Your admin session has expired. Log in again to continue.",
    };
  }

  const conversationId = valueFromForm(formData, "conversation_id");

  if (!conversationId) {
    return {
      status: "error",
      message: "Conversation id is required.",
    };
  }

  try {
    await createOrUpdateHotLeadForConversation(conversationId);
    revalidateSDR(conversationId);

    return {
      status: "success",
      message: "Hot lead created or updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Hot lead could not be updated.",
    };
  }
}
