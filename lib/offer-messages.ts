import type { Business } from "@/types/database";
import type { RenderableWebsite } from "@/types/website-rendering";

type OfferMessageInput = {
  business: Business | null;
  previewUrl: string;
  website: RenderableWebsite;
};

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function businessName({ business, website }: OfferMessageInput) {
  return (
    compact(business?.business_name) ||
    compact(website.website_json.brand.businessName) ||
    "your business"
  );
}

function businessNiche({ business }: OfferMessageInput) {
  return (
    compact(business?.business_type) ||
    compact(business?.services) ||
    "local business"
  );
}

function cityPhrase({ business }: OfferMessageInput) {
  const city = compact(business?.city);

  return city ? ` in ${city}` : "";
}

export function generateClientPreviewMessage(input: OfferMessageInput) {
  const name = businessName(input);
  const niche = businessNiche(input);
  const location = cityPhrase(input);

  return `Hi ${name} team, I put together a quick preview concept for ${name}${location} as a ${niche}. It is a simple draft showing how your site could look with clearer services, stronger calls to action, and an easier way for customers to reach you.

Preview: ${input.previewUrl}

If it feels useful, I can adjust the copy, sections, and details before anything goes live.`;
}

export function generateFollowUpMessage(input: OfferMessageInput) {
  const name = businessName(input);

  return `Hi ${name} team, just checking whether you had a chance to look at the preview concept:

${input.previewUrl}

Would you like any changes, or would it be worth a quick chat?`;
}
