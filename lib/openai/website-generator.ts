import "server-only";

import { OpenAIProviderError } from "@/lib/ai/openai-errors";
import { generateStructuredJSON } from "@/lib/ai/openai-client";
import { validateGeneratedWebsiteContent } from "@/lib/generated-website-validator";
import {
  generateMockWebsiteContent,
  shouldUseMockAi,
} from "@/lib/mock-website-generator";
import type { Business } from "@/types/database";
import type { GeneratedWebsiteContent } from "@/types/generated-website";

const websiteContentSchema = {
  type: "object",
  properties: {
    brand: {
      type: "object",
      properties: {
        businessName: { type: "string" },
        tagline: { type: "string" },
        tone: { type: "string" },
        primaryColor: { type: "string" },
        secondaryColor: { type: "string" },
      },
      required: [
        "businessName",
        "tagline",
        "tone",
        "primaryColor",
        "secondaryColor",
      ],
      additionalProperties: false,
    },
    hero: {
      type: "object",
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        ctaText: { type: "string" },
      },
      required: ["headline", "subheadline", "ctaText"],
      additionalProperties: false,
    },
    services: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
    },
    about: {
      type: "object",
      properties: {
        title: { type: "string" },
        paragraph: { type: "string" },
      },
      required: ["title", "paragraph"],
      additionalProperties: false,
    },
    whyChooseUs: {
      type: "array",
      items: { type: "string" },
    },
    faq: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
        additionalProperties: false,
      },
    },
    contact: {
      type: "object",
      properties: {
        ctaText: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        city: { type: "string" },
      },
      required: ["ctaText", "phone", "email", "city"],
      additionalProperties: false,
    },
    seo: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["title", "description"],
      additionalProperties: false,
    },
  },
  required: [
    "brand",
    "hero",
    "services",
    "about",
    "whyChooseUs",
    "faq",
    "contact",
    "seo",
  ],
  additionalProperties: false,
} as const;

type BusinessWebsitePromptRecord = {
  business_name: string;
  business_type: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  email: string | null;
  main_cta: string | null;
  phone: string | null;
  preferred_style: string | null;
  services: string | null;
  website_url: string | null;
};

function businessSummary(business: Business): BusinessWebsitePromptRecord {
  return {
    business_name: business.business_name,
    business_type: business.business_type,
    city: business.city,
    country: business.country,
    phone: business.phone,
    email: business.email,
    website_url: business.website_url,
    services: business.services,
    description: business.description,
    preferred_style: business.preferred_style,
    main_cta: business.main_cta,
  };
}

function buildPrompt(business: Business) {
  return `Create structured website JSON for this small local business.

Business record:
${JSON.stringify(businessSummary(business), null, 2)}

Requirements:
- Write concise, professional marketing copy for a local business website.
- Do not generate HTML, Markdown, JSX, CSS, scripts, or arbitrary code.
- Keep claims realistic and do not invent awards, certifications, pricing, or guarantees.
- Use the business phone, email, and city when available. If a contact detail is missing, use a helpful placeholder such as "Contact us" rather than inventing private data.
- services must include 3-6 items.
- whyChooseUs must include 3-5 short bullet points.
- faq must include 4-6 question and answer pairs.
- primaryColor and secondaryColor should be usable CSS color strings.
- seo.description should be suitable for a meta description and stay under 160 characters.
- Do not claim the business has reviews, awards, certifications, emergency availability, years in business, or guarantees unless the record explicitly says so.`;
}

export async function generateWebsiteContent(
  business: Business,
): Promise<GeneratedWebsiteContent> {
  if (shouldUseMockAi()) {
    return generateMockWebsiteContent(business);
  }

  const parsed = await generateStructuredJSON<unknown>({
    feature: "Website generation",
    maxOutputTokens: 4000,
    schema: websiteContentSchema,
    schemaName: "generated_website_content",
    system:
      "You are a senior website copywriter. Return only structured JSON that matches the provided schema. Do not generate HTML, Markdown, JSX, CSS, or scripts.",
    user: buildPrompt(business),
  });

  const validation = validateGeneratedWebsiteContent(parsed);

  if (!validation.ok) {
    throw new OpenAIProviderError(
      "schema_validation_failed",
      `OpenAI returned incomplete website JSON: ${validation.error}`,
    );
  }

  return validation.data;
}
