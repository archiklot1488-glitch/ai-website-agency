"use server";

import { createLeadForLiveWebsite } from "@/lib/leads";
import type { ActionState } from "@/types/actions";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function submitLeadAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const websiteId = valueFromForm(formData, "website_id");
  const name = valueFromForm(formData, "name");
  const email = valueFromForm(formData, "email");
  const phone = valueFromForm(formData, "phone");
  const message = valueFromForm(formData, "message");

  if (!websiteId) {
    return {
      status: "error",
      message: "Website id is missing.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Enter your name.",
    };
  }

  if (!email && !phone) {
    return {
      status: "error",
      message: "Enter an email or phone number.",
    };
  }

  if (!message) {
    return {
      status: "error",
      message: "Enter a short message.",
    };
  }

  try {
    await createLeadForLiveWebsite({
      websiteId,
      name,
      email,
      phone,
      message,
    });

    return {
      status: "success",
      message: "Thanks. Your message has been sent.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Your message could not be sent.",
    };
  }
}
