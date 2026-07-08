"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { launchWebsiteForLead, updateLeadDeal } from "@/lib/deals";
import type { ActionState } from "@/types/actions";
import type { LeadPriority, LeadStatus } from "@/types/deals";
import { isLeadPriority, isLeadStatus } from "@/types/deals";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDealValueCents(value: string | null) {
  if (!value) {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (!/^\d+$/.test(value)) {
    return {
      ok: false as const,
      error: "Deal value must be a whole number of cents.",
    };
  }

  const cents = Number(value);

  if (!Number.isSafeInteger(cents)) {
    return {
      ok: false as const,
      error: "Deal value is too large.",
    };
  }

  return {
    ok: true as const,
    value: cents,
  };
}

function validIntent(value: string | null) {
  if (
    value === "save" ||
    value === "contacted" ||
    value === "lost" ||
    value === "paid_manual"
  ) {
    return value;
  }

  return "save";
}

export async function saveLeadDealAction(
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

  const leadId = valueFromForm(formData, "lead_id");

  if (!leadId) {
    return {
      status: "error",
      message: "Lead id is required.",
    };
  }

  const statusValue = valueFromForm(formData, "status") ?? "new";
  const priorityValue = valueFromForm(formData, "priority") ?? "normal";

  if (!isLeadStatus(statusValue)) {
    return {
      status: "error",
      message: "Choose a valid lead status.",
    };
  }

  if (!isLeadPriority(priorityValue)) {
    return {
      status: "error",
      message: "Choose a valid priority.",
    };
  }

  const dealValue = parseDealValueCents(valueFromForm(formData, "deal_value_cents"));

  if (!dealValue.ok) {
    return {
      status: "error",
      message: dealValue.error,
    };
  }

  try {
    await updateLeadDeal(
      leadId,
      {
        adminNotes: valueFromForm(formData, "admin_notes"),
        conversationSummary: valueFromForm(formData, "conversation_summary"),
        dealCurrency: valueFromForm(formData, "deal_currency") ?? "USD",
        dealValueCents: dealValue.value,
        preferredPaymentMethod: valueFromForm(formData, "preferred_payment_method"),
        priority: priorityValue as LeadPriority,
        status: statusValue as LeadStatus,
      },
      validIntent(valueFromForm(formData, "intent")),
    );

    revalidatePath("/admin");
    revalidatePath("/admin/leads");

    return {
      status: "success",
      message: "Lead deal saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Lead deal could not be saved.",
    };
  }
}

export async function launchWebsiteAction(
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

  const leadId = valueFromForm(formData, "lead_id");

  if (!leadId) {
    return {
      status: "error",
      message: "Lead id is required.",
    };
  }

  try {
    const website = await launchWebsiteForLead(leadId);

    revalidatePath("/admin");
    revalidatePath("/admin/leads");
    revalidatePath(`/site/${website.slug}`);

    return {
      status: "success",
      message: `Website launched at /site/${website.slug}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Website could not be launched.",
    };
  }
}
