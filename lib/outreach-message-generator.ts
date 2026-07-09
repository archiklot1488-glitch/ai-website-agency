import "server-only";

import { getAIConfig } from "@/lib/ai/ai-config";
import { logSanitizedOpenAIError } from "@/lib/ai/openai-errors";
import { generateStructuredJSON } from "@/lib/ai/openai-client";
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

type OutreachDraftPackage = {
  drafts: OutreachDraft[];
  errorMessage?: string;
  provider: "deterministic" | "openai";
};

type OpenAIMessageDraft = {
  body: string;
  subject: string;
};

type OpenAIOutreachDrafts = {
  followUp1: OpenAIMessageDraft;
  followUp2: OpenAIMessageDraft;
  initialPreview: OpenAIMessageDraft;
  objectionExistingSite: OpenAIMessageDraft;
  objectionMakeChanges: OpenAIMessageDraft;
  objectionNotInterested: OpenAIMessageDraft;
  objectionPrice: OpenAIMessageDraft;
  objectionSendDetails: OpenAIMessageDraft;
};

const openAIMessageDraftSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
  additionalProperties: false,
} as const;

const openAIOutreachSchema = {
  type: "object",
  properties: {
    initialPreview: openAIMessageDraftSchema,
    followUp1: openAIMessageDraftSchema,
    followUp2: openAIMessageDraftSchema,
    objectionPrice: openAIMessageDraftSchema,
    objectionExistingSite: openAIMessageDraftSchema,
    objectionNotInterested: openAIMessageDraftSchema,
    objectionSendDetails: openAIMessageDraftSchema,
    objectionMakeChanges: openAIMessageDraftSchema,
  },
  required: [
    "initialPreview",
    "followUp1",
    "followUp2",
    "objectionPrice",
    "objectionExistingSite",
    "objectionNotInterested",
    "objectionSendDetails",
    "objectionMakeChanges",
  ],
  additionalProperties: false,
} as const;

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

function deterministicOutreachDrafts(input: OutreachInput) {
  return [
    generateInitialPreviewDraft(input),
    generateFollowUpOneDraft(input),
    generateFollowUpTwoDraft(input),
    ...generateObjectionDrafts(input),
  ];
}

function cleanDraft(
  draft: OpenAIMessageDraft,
  fallback: OutreachDraft,
): OpenAIMessageDraft {
  return {
    body: draft.body.trim() || fallback.body,
    subject: draft.subject.trim() || fallback.subject,
  };
}

function businessContext(input: OutreachInput) {
  return {
    business_name: businessName(input),
    business_type: niche(input),
    city: compact(input.business?.city),
    country: compact(input.business?.country),
    preview_url: input.previewUrl,
    website_tagline: input.website.website_json.brand.tagline,
    website_tone: input.website.website_json.brand.tone,
    website_services: input.website.website_json.services.map(
      (service) => service.title,
    ),
  };
}

function buildOutreachPrompt(input: OutreachInput) {
  return `Create client-facing outreach draft messages for a manual website preview workflow.

Context:
${JSON.stringify(businessContext(input), null, 2)}

Rules:
- These are draft suggestions only. Do not imply any message will be sent automatically.
- Keep messages short, natural, and personalized to the business name, city, and niche.
- Include the preview URL in the initial preview and both follow-up messages.
- Be honest that this is a quick preview concept.
- Do not claim the client requested it.
- Do not invent relationships, testimonials, awards, performance numbers, urgency, discounts, or guaranteed results.
- Keep cold outreach friendly and opt-out safe.
- Objection responses should be helpful and brief.`;
}

function applyOpenAIDrafts(
  generated: OpenAIOutreachDrafts,
  fallbackDrafts: OutreachDraft[],
): OutreachDraft[] {
  const byKey = new Map(fallbackDrafts.map((draft) => [draft.key, draft]));
  const initial = byKey.get("initial_preview") as OutreachDraft;
  const followUp1 = byKey.get("follow_up_1") as OutreachDraft;
  const followUp2 = byKey.get("follow_up_2") as OutreachDraft;
  const objectionPrice = byKey.get("objection_price") as OutreachDraft;
  const objectionExistingSite = byKey.get(
    "objection_existing_site",
  ) as OutreachDraft;
  const objectionNotInterested = byKey.get(
    "objection_not_interested",
  ) as OutreachDraft;
  const objectionSendDetails = byKey.get(
    "objection_send_details",
  ) as OutreachDraft;
  const objectionMakeChanges = byKey.get(
    "objection_make_changes",
  ) as OutreachDraft;

  const pairs: Array<[OutreachDraft, OpenAIMessageDraft]> = [
    [initial, generated.initialPreview],
    [followUp1, generated.followUp1],
    [followUp2, generated.followUp2],
    [objectionPrice, generated.objectionPrice],
    [objectionExistingSite, generated.objectionExistingSite],
    [objectionNotInterested, generated.objectionNotInterested],
    [objectionSendDetails, generated.objectionSendDetails],
    [objectionMakeChanges, generated.objectionMakeChanges],
  ];

  return pairs.map(([fallback, generatedDraft]) => {
    const cleaned = cleanDraft(generatedDraft, fallback);

    return {
      ...fallback,
      body: cleaned.body,
      subject: cleaned.subject,
    };
  });
}

async function generateOpenAIOutreachDrafts(
  input: OutreachInput,
  fallbackDrafts: OutreachDraft[],
) {
  const generated = await generateStructuredJSON<OpenAIOutreachDrafts>({
    feature: "Outreach draft generation",
    maxOutputTokens: 2200,
    schema: openAIOutreachSchema,
    schemaName: "outreach_drafts",
    system:
      "You write concise manual outreach drafts for website preview concepts. Return only JSON that matches the schema.",
    user: buildOutreachPrompt(input),
  });

  return applyOpenAIDrafts(generated, fallbackDrafts);
}

export async function generateOutreachDraftPackage(
  input: OutreachInput,
): Promise<OutreachDraftPackage> {
  const fallbackDrafts = deterministicOutreachDrafts(input);

  if (!getAIConfig().outreachUsesOpenAI) {
    return {
      drafts: fallbackDrafts,
      provider: "deterministic",
    };
  }

  try {
    return {
      drafts: await generateOpenAIOutreachDrafts(input, fallbackDrafts),
      provider: "openai",
    };
  } catch (error) {
    logSanitizedOpenAIError("Outreach draft generation", error);

    return {
      drafts: fallbackDrafts,
      errorMessage:
        error instanceof Error
          ? `${error.message} Deterministic drafts are shown instead.`
          : "OpenAI outreach generation failed. Deterministic drafts are shown instead.",
      provider: "deterministic",
    };
  }
}

export async function generateOutreachDrafts(input: OutreachInput) {
  return (await generateOutreachDraftPackage(input)).drafts;
}
