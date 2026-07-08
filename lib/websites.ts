import "server-only";

import { randomBytes, randomUUID } from "crypto";
import { validateGeneratedWebsiteContent } from "@/lib/generated-website-validator";
import { generateWebsiteContent } from "@/lib/openai/website-generator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Website } from "@/types/database";
import type { RenderableWebsite } from "@/types/website-rendering";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

type WebsiteLoadResult =
  | {
      status: "ok";
      website: RenderableWebsite;
    }
  | {
      status: "not-found";
    }
  | {
      status: "invalid";
      message: string;
    };

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "business";
}

function shortToken() {
  return randomBytes(3).toString("hex");
}

function validateWebsiteForRendering(website: Website): WebsiteLoadResult {
  if (!website.website_json) {
    return {
      status: "invalid",
      message: "This website does not have generated JSON content yet.",
    };
  }

  const validation = validateGeneratedWebsiteContent(website.website_json);

  if (!validation.ok) {
    return {
      status: "invalid",
      message: `Generated website JSON is invalid: ${validation.error}`,
    };
  }

  return {
    status: "ok",
    website: {
      ...website,
      website_json: validation.data,
    },
  };
}

async function createUniqueSlug(
  supabase: SupabaseServerClient,
  businessName: string,
) {
  const baseSlug = slugify(businessName);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${shortToken()}`;
    const { data, error } = await supabase
      .from("websites")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }
  }

  throw new Error("Could not create a unique website slug.");
}

export async function generateWebsitePreviewForBusiness(businessId: string) {
  const supabase = createSupabaseServerClient();

  const { data: existingWebsite, error: existingError } = await supabase
    .from("websites")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingWebsite) {
    throw new Error("A website preview already exists for this business.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be found.");
  }

  const websiteJson = await generateWebsiteContent(business);
  const slug = await createUniqueSlug(supabase, business.business_name);
  const previewToken = randomUUID();

  const payload: Database["public"]["Tables"]["websites"]["Insert"] = {
    business_id: business.id,
    slug,
    preview_token: previewToken,
    website_json: websiteJson,
    status: "preview",
    is_live: false,
  };

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .insert(payload)
    .select("*")
    .single();

  if (websiteError || !website) {
    throw new Error(websiteError?.message || "Website preview could not be saved.");
  }

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ status: "preview" })
    .eq("id", business.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return website satisfies Website;
}

export async function getPreviewWebsiteBySlug(
  slug: string,
  token: string | null,
): Promise<WebsiteLoadResult> {
  if (!token) {
    return {
      status: "not-found",
    };
  }

  const supabase = createSupabaseServerClient();
  const { data: website, error } = await supabase
    .from("websites")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !website) {
    return {
      status: "not-found",
    };
  }

  if (website.preview_token !== token) {
    return {
      status: "not-found",
    };
  }

  if (website.status !== "preview" && website.status !== "live") {
    return {
      status: "not-found",
    };
  }

  return validateWebsiteForRendering(website);
}

export async function getLiveWebsiteBySlug(
  slug: string,
): Promise<WebsiteLoadResult> {
  const supabase = createSupabaseServerClient();
  const { data: website, error } = await supabase
    .from("websites")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !website) {
    return {
      status: "not-found",
    };
  }

  if (website.status !== "live") {
    return {
      status: "not-found",
    };
  }

  return validateWebsiteForRendering(website);
}
