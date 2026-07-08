import "server-only";

import { validateGeneratedWebsiteContent } from "@/lib/generated-website-validator";
import type { Business } from "@/types/database";
import type { GeneratedWebsiteContent } from "@/types/generated-website";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

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

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

function businessSummary(business: Business) {
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
- seo.description should be suitable for a meta description and stay under 160 characters.`;
}

function extractResponseText(response: OpenAIResponse) {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  for (const outputItem of response.output ?? []) {
    for (const content of outputItem.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function sanitizeOpenAIError(message: string) {
  return message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

async function readOpenAIResponse(response: Response) {
  try {
    return (await response.json()) as OpenAIResponse;
  } catch {
    return {
      error: {
        message: "The OpenAI API returned a response that was not JSON.",
      },
    } satisfies OpenAIResponse;
  }
}

export async function generateWebsiteContent(
  business: Business,
): Promise<GeneratedWebsiteContent> {
  const { apiKey, model } = getOpenAIConfig();

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a senior website copywriter. Return only structured JSON that matches the provided schema.",
        },
        {
          role: "user",
          content: buildPrompt(business),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "generated_website_content",
          schema: websiteContentSchema,
          strict: true,
        },
      },
      store: false,
      max_output_tokens: 2500,
    }),
  });

  const responseBody = await readOpenAIResponse(response);

  if (!response.ok) {
    throw new Error(
      responseBody.error?.message
        ? `OpenAI generation failed: ${sanitizeOpenAIError(responseBody.error.message)}`
        : `OpenAI generation failed with status ${response.status}.`,
    );
  }

  const text = extractResponseText(responseBody);

  if (!text) {
    throw new Error("OpenAI did not return website JSON.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  const validation = validateGeneratedWebsiteContent(parsed);

  if (!validation.ok) {
    throw new Error(`OpenAI returned incomplete website JSON: ${validation.error}`);
  }

  return validation.data;
}
