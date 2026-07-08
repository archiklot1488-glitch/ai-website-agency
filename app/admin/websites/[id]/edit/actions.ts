"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateWebsiteJson } from "@/lib/websites";
import type { ActionState } from "@/types/actions";

function valueFromForm(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveWebsiteEditorAction(
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
  const contentJson = valueFromForm(formData, "website_json");

  if (!websiteId || !contentJson) {
    return {
      status: "error",
      message: "Website content is missing.",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(contentJson);
  } catch {
    return {
      status: "error",
      message: "Website content is not valid JSON.",
    };
  }

  try {
    await updateWebsiteJson(websiteId, parsed);
    revalidatePath("/admin");
    revalidatePath(`/admin/websites/${websiteId}/edit`);

    return {
      status: "success",
      message: "Website saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Website could not be saved.",
    };
  }
}
