"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  requireAdmin,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { createBusiness } from "@/lib/businesses";
import type { ActionState } from "@/types/actions";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = valueFromForm(formData, "password");

  if (!password) {
    return {
      status: "error",
      message: "Enter the admin password.",
    };
  }

  const isValid = await verifyAdminPassword(password);

  if (!isValid) {
    return {
      status: "error",
      message: "The password is incorrect or ADMIN_PASSWORD is not configured.",
    };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function createBusinessAction(
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

  const businessName = valueFromForm(formData, "business_name");

  if (!businessName) {
    return {
      status: "error",
      message: "Business name is required.",
    };
  }

  try {
    await createBusiness({
      business_name: businessName,
      business_type: valueFromForm(formData, "business_type"),
      city: valueFromForm(formData, "city"),
      country: valueFromForm(formData, "country"),
      phone: valueFromForm(formData, "phone"),
      email: valueFromForm(formData, "email"),
      website_url: valueFromForm(formData, "website_url"),
      services: valueFromForm(formData, "services"),
      description: valueFromForm(formData, "description"),
      preferred_style: valueFromForm(formData, "preferred_style"),
      main_cta: valueFromForm(formData, "main_cta"),
    });

    revalidatePath("/admin");

    return {
      status: "success",
      message: "Business saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The business could not be saved.",
    };
  }
}
