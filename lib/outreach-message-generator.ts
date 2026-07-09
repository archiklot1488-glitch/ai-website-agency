import type { Business } from "@/types/database";
import type { RenderableWebsite } from "@/types/website-rendering";
import type { OutreachMessageType } from "@/types/outreach";

export type OutreachDraft = {
  body: string;
  key: string;
  label: string;
  messageType: OutreachMessageType;
  subject: string;
};

type OutreachInput = {
  business: Business | null;
  previewUrl: string;
  website: RenderableWebsite;
};

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function businessName(input: OutreachInput) {
  return (
    compact(input.business?.business_name) ||
    compact(input.website.website_json.brand.businessName) ||
    "your business"
  );
}

function niche(input: OutreachInput) {
  return (
    compact(input.business?.business_type) ||
    compact(input.business?.services) ||
    "local business"
  );
}

function cityPhrase(input: OutreachInput) {
  const city = compact(input.business?.city);

  return city ? ` in ${city}` : "";
}

export function generateInitialPreviewDraft(input: OutreachInput): OutreachDraft {
  const name = businessName(input);
  const businessNiche = niche(input);
  const location = cityPhrase(input);

  return {
    body: `Hi ${name} team,

I put together a quick preview concept for ${name}${location} as a ${businessNiche}. It shows a cleaner one-page website structure with clearer services, stronger calls to action, and an easier way for customers to get in touch.

Preview: ${input.previewUrl}

This is just a draft concept. If it feels useful, I can adjust the copy, sections, and details before anything goes live.`,
    key: "initial_preview",
    label: "Initial preview",
    messageType: "initial_preview",
    subject: `Quick website preview concept for ${name}`,
  };
}

export function generateFollowUpOneDraft(input: OutreachInput): OutreachDraft {
  const name = businessName(input);

  return {
    body: `Hi ${name} team,

Just checking whether you had a chance to look at the preview concept:

${input.previewUrl}

Would you want any changes, or would it be useful to have a quick chat about it?`,
    key: "follow_up_1",
    label: "Follow-up 1",
    messageType: "follow_up_1",
    subject: `Following up on the ${name} preview`,
  };
}

export function generateFollowUpTwoDraft(input: OutreachInput): OutreachDraft {
  const name = businessName(input);

  return {
    body: `Hi ${name} team,

Last gentle check-in on the preview concept:

${input.previewUrl}

No pressure either way. If now is not a fit, I understand.`,
    key: "follow_up_2",
    label: "Follow-up 2",
    messageType: "follow_up_2",
    subject: `Final check-in on the ${name} preview`,
  };
}

export function generateObjectionDrafts(input: OutreachInput): OutreachDraft[] {
  const name = businessName(input);

  return [
    {
      body: `Happy to share pricing. The exact number depends on what you want changed before launch, but I can keep it simple and transparent. If you want, I can send a fixed one-time price for finishing and launching the ${name} site.`,
      key: "objection_price",
      label: "How much does it cost?",
      messageType: "objection_response",
      subject: `Re: ${name} website preview - pricing`,
    },
    {
      body: `That makes sense. The preview is not meant to replace something that already works well. It is a concept for a cleaner, more conversion-focused version, so you can compare it against your current site and decide whether any improvements are worth making.`,
      key: "objection_existing_site",
      label: "We already have a website",
      messageType: "objection_response",
      subject: `Re: ${name} website preview - current site`,
    },
    {
      body: `Thanks for letting me know. I will not keep following up. If you ever want to revisit the preview or need a simple website update later, feel free to reach out.`,
      key: "objection_not_interested",
      label: "Not interested",
      messageType: "objection_response",
      subject: `Re: ${name} website preview - thanks`,
    },
    {
      body: `Absolutely. The short version: I created a quick preview concept for ${name}, and if you like the direction, I can revise the text/details and help launch it as a live site. Preview: ${input.previewUrl}`,
      key: "objection_send_details",
      label: "Send me details",
      messageType: "objection_response",
      subject: `Details for the ${name} preview`,
    },
    {
      body: `Yes, changes are expected. The preview is a starting point, so I can adjust wording, services, colors, contact details, sections, and calls to action before anything goes live.`,
      key: "objection_make_changes",
      label: "Can you make changes?",
      messageType: "objection_response",
      subject: `Re: ${name} website preview - changes`,
    },
  ];
}

export function generateOutreachDrafts(input: OutreachInput) {
  return [
    generateInitialPreviewDraft(input),
    generateFollowUpOneDraft(input),
    generateFollowUpTwoDraft(input),
    ...generateObjectionDrafts(input),
  ];
}
