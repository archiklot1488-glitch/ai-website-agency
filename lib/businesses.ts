import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Business, BusinessInsert, Website } from "@/types/database";

export type BusinessWithWebsite = Business & {
  website: Website | null;
};

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
  businesses: BusinessWithWebsite[];
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

    const businesses = data ?? [];
    const businessIds = businesses.map((business) => business.id);
    const websitesByBusinessId = new Map<string, Website>();

    if (businessIds.length > 0) {
      const { data: websites, error: websitesError } = await supabase
        .from("websites")
        .select("*")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false });

      if (websitesError) {
        return {
          businesses: [],
          error: websitesError.message,
        };
      }

      for (const website of websites ?? []) {
        if (website.business_id && !websitesByBusinessId.has(website.business_id)) {
          websitesByBusinessId.set(website.business_id, website);
        }
      }
    }

    return {
      businesses: businesses.map((business) => ({
        ...business,
        website: websitesByBusinessId.get(business.id) ?? null,
      })),
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
