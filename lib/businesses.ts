import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, BusinessInsert } from "@/types/database";

export type BusinessFormValues = Pick<
  BusinessInsert,
  | "business_name"
  | "business_type"
  | "city"
  | "country"
  | "phone"
  | "email"
  | "website_url"
  | "services"
  | "description"
  | "preferred_style"
  | "main_cta"
>;

export async function getBusinesses(): Promise<{
  businesses: Business[];
  error: string | null;
}> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        businesses: [],
        error: error.message,
      };
    }

    return {
      businesses: data ?? [],
      error: null,
    };
  } catch (error) {
    return {
      businesses: [],
      error:
        error instanceof Error
          ? error.message
          : "Businesses could not be loaded.",
    };
  }
}

export async function createBusiness(values: BusinessFormValues) {
  const payload: BusinessInsert = {
    ...values,
    status: "draft",
  };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
