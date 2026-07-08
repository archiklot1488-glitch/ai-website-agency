"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateWebsiteOffer } from "@/lib/website-offers";
import type { ActionState } from "@/types/actions";
import { isOutreachStatus } from "@/types/offers";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOfferPriceCents(value: string | null) {
  if (!value) {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (!/^\d+$/.test(value)) {
    return {
      ok: false as const,
      error: "Offer price must be a whole number of cents.",
    };
  }

  const cents = Number(value);

  if (!Number.isSafeInteger(cents)) {
    return {
      ok: false as const,
      error: "Offer price is too large.",
    };
  }

  return {
    ok: true as const,
    value: cents,
  };
}

export async function saveOfferPackageAction(
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

  const websiteId = valueFromForm(formData, "website_id");

  if (!websiteId) {
    return {
      status: "error",
      message: "Website id is required.",
    };
  }

  const priceResult = parseOfferPriceCents(
    valueFromForm(formData, "offer_price_cents"),
  );

  if (!priceResult.ok) {
    return {
      status: "error",
      message: priceResult.error,
    };
  }

  const currency = (valueFromForm(formData, "offer_currency") ?? "USD")
    .toUpperCase()
    .slice(0, 12);

  if (!/^[A-Z]{3,12}$/.test(currency)) {
    return {
      status: "error",
      message: "Offer currency must use letters only, such as USD.",
    };
  }

  const outreachStatus = valueFromForm(formData, "outreach_status") ?? "not_sent";

  if (!isOutreachStatus(outreachStatus)) {
    return {
      status: "error",
      message: "Choose a valid outreach status.",
    };
  }

  const clientMessage = valueFromForm(formData, "client_message");
  const followUpMessage = valueFromForm(formData, "follow_up_message");
  const intent = valueFromForm(formData, "intent");
  const shouldMarkSent = intent === "mark_sent";

  if (shouldMarkSent && !clientMessage) {
    return {
      status: "error",
      message: "Client message is required before marking the preview sent.",
    };
  }

  try {
    await updateWebsiteOffer(
      websiteId,
      {
        client_message: clientMessage,
        follow_up_message: followUpMessage,
        offer_currency: currency,
        offer_notes: valueFromForm(formData, "offer_notes"),
        offer_price_cents: priceResult.value,
        outreach_status: outreachStatus,
      },
      shouldMarkSent,
    );

    revalidatePath("/admin");
    revalidatePath(`/admin/websites/${websiteId}/offer`);

    return {
      status: "success",
      message: shouldMarkSent
        ? "Preview marked sent."
        : "Offer package saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Offer package could not be saved.",
    };
  }
}
