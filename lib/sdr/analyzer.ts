import "server-only";

import { getAIConfig } from "@/lib/ai/ai-config";
import { logSanitizedOpenAIError } from "@/lib/ai/openai-errors";
import { generateStructuredJSON } from "@/lib/ai/openai-client";
import type {
  SDRAnalysisResult,
  SDRAnalyzeInput,
  SDRIntent,
} from "@/types/sdr";
import { SDR_INTENTS, isSDRIntent } from "@/types/sdr";

type SDRAnalyzer = {
  analyze(input: SDRAnalyzeInput): Promise<SDRAnalysisResult>;
};

const HOT_INTENTS: SDRIntent[] = [
  "interested",
  "price_question",
  "needs_changes",
  "wants_call",
];

type OpenAISDRAnalysis = {
  admin_notes: string;
  confidence: number;
  conversation_summary: string;
  detected_intent: string;
  handoff_required: boolean;
  safety_flags: string[];
  suggested_reply: string;
};

const openAISDRSchema = {
  type: "object",
  properties: {
    detected_intent: {
      type: "string",
      enum: SDR_INTENTS,
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    handoff_required: { type: "boolean" },
    conversation_summary: { type: "string" },
    suggested_reply: { type: "string" },
    admin_notes: { type: "string" },
    safety_flags: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "detected_intent",
    "confidence",
    "handoff_required",
    "conversation_summary",
    "suggested_reply",
    "admin_notes",
    "safety_flags",
  ],
  additionalProperties: false,
} as const;

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

function businessName(input: SDRAnalyzeInput) {
  return (
    compact(input.business?.business_name) ||
    compact(input.website?.website_json?.brand.businessName) ||
    "your business"
  );
}

function includesAny(message: string, phrases: string[]) {
  return phrases.some((phrase) => message.includes(phrase));
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  return Math.min(Math.max(value, 0), 1);
}

function detectIntent(message: string): SDRIntent {
  const normalized = message.toLowerCase().trim();

  if (
    normalized.length < 3 ||
    includesAny(normalized, ["crypto", "casino", "loan offer", "free money"])
  ) {
    return "spam";
  }

  if (includesAny(normalized, ["not interested", "no thanks", "stop"])) {
    return "not_interested";
  }

  if (
    includesAny(normalized, [
      "already have a website",
      "already have website",
      "we have a site",
      "we already have a site",
    ])
  ) {
    return "already_has_website";
  }

  if (includesAny(normalized, ["price", "cost", "how much", "quote", "pricing"])) {
    return "price_question";
  }

  if (includesAny(normalized, ["change", "edit", "update", "modify"])) {
    return "needs_changes";
  }

  if (includesAny(normalized, ["call", "phone", "talk", "meeting"])) {
    return "wants_call";
  }

  if (
    includesAny(normalized, [
      "interested",
      "looks good",
      "yes",
      "let's do it",
      "lets do it",
      "sounds good",
    ])
  ) {
    return "interested";
  }

  return "unclear";
}

function replyForIntent(intent: SDRIntent, input: SDRAnalyzeInput) {
  const name = businessName(input);

  switch (intent) {
    case "price_question":
      return `Thanks for asking. Pricing can be adjusted based on what you want changed before launch. I can send a simple fixed option for finishing the ${name} preview, or we can do a quick call to confirm scope first.`;
    case "needs_changes":
      return `Absolutely. The preview is meant to be revised before anything goes live. Please send the changes you want for ${name}, and I can update the copy, sections, colors, or contact details.`;
    case "interested":
      return `Great, glad the preview feels useful. What is the best next step for you: a quick call, or should I send the details and scope in writing?`;
    case "wants_call":
      return `A quick call works. Please send a couple of times that are convenient for you, and I will confirm one before we discuss the ${name} preview and next steps.`;
    case "already_has_website":
      return `That makes sense. This preview can be treated as a redesign or conversion-improvement concept rather than a replacement unless it clearly improves on your current site.`;
    case "not_interested":
      return `Thanks for letting me know. I will not keep following up. If you ever want to revisit the preview later, feel free to reach out.`;
    case "spam":
      return "This message does not look like a serious client reply. No response is recommended unless the admin recognizes the sender.";
    case "unclear":
      return `Thanks for the reply. Could you clarify whether you want changes to the preview, pricing details, or a quick call to discuss next steps?`;
  }
}

function reasoningForIntent(intent: SDRIntent) {
  const reasons: Record<SDRIntent, string> = {
    already_has_website: "Client mentioned they already have a website.",
    interested: "Client used positive or buying-signal language.",
    needs_changes: "Client asked for edits, changes, or updates.",
    not_interested: "Client declined or asked to stop.",
    price_question: "Client asked about price, cost, quote, or pricing.",
    spam: "Message is too short or contains suspicious terms.",
    unclear: "No strong intent phrase was detected.",
    wants_call: "Client asked for a call, phone discussion, or meeting.",
  };

  return reasons[intent];
}

class DeterministicSDRAnalyzer implements SDRAnalyzer {
  async analyze(input: SDRAnalyzeInput): Promise<SDRAnalysisResult> {
    const intent = detectIntent(input.message);
    const handoffRequired = HOT_INTENTS.includes(intent);
    const summary = `${businessName(input)} client message: ${input.message.trim()}`;

    return {
      confidence: intent === "unclear" ? 0.45 : intent === "spam" ? 0.7 : 0.82,
      handoffRequired,
      intent,
      reasoning: reasoningForIntent(intent),
      reply: {
        body: replyForIntent(intent, input),
      },
      summary,
    };
  }
}

function messageHistory(input: SDRAnalyzeInput) {
  return (input.previousMessages ?? []).slice(-8).map((message) => ({
    body: message.body,
    created_at: message.created_at,
    direction: message.direction,
    role: message.sender_role,
  }));
}

function buildSDRPrompt(input: SDRAnalyzeInput) {
  return `Analyze this inbound client reply for a manual AI website preview sales workflow.

Business context:
${JSON.stringify(
  {
    business_name: businessName(input),
    business_type: input.business?.business_type ?? null,
    city: input.business?.city ?? null,
    website_slug: input.website?.slug ?? null,
    outreach_status: input.website?.outreach_status ?? null,
  },
  null,
  2,
)}

Recent message history:
${JSON.stringify(messageHistory(input), null, 2)}

Inbound reply:
${input.message}

Rules:
- Output only structured JSON matching the schema.
- detected_intent must be one of: ${SDR_INTENTS.join(", ")}.
- Set handoff_required=true for interested, price_question, needs_changes, or wants_call.
- Set handoff_required=false for not_interested, spam, and already_has_website unless the reply explicitly asks for a call or price.
- If the reply says stop, unsubscribe, remove me, or not interested, use detected_intent="not_interested", set handoff_required=false, and suggest a polite closure with no further follow-up.
- Do not pretend an email, SMS, payment, or task will be sent automatically.
- Suggested replies must be short, honest, and suitable for admin review before manual sending.
- safety_flags should mention compliance risks such as unsubscribe request, hostile message, spam, or unclear consent when relevant.`;
}

function normalizeOpenAISDRResult(
  generated: OpenAISDRAnalysis,
  input: SDRAnalyzeInput,
): SDRAnalysisResult {
  const intent = isSDRIntent(generated.detected_intent)
    ? generated.detected_intent
    : "unclear";
  let handoffRequired = generated.handoff_required;

  if (intent === "not_interested" || intent === "spam") {
    handoffRequired = false;
  } else if (HOT_INTENTS.includes(intent)) {
    handoffRequired = true;
  }

  return {
    adminNotes: generated.admin_notes.trim(),
    confidence: clampConfidence(generated.confidence),
    handoffRequired,
    intent,
    reasoning: generated.admin_notes.trim(),
    reply: {
      body: generated.suggested_reply.trim() || replyForIntent(intent, input),
    },
    safetyFlags: generated.safety_flags
      .map((flag) => flag.trim())
      .filter(Boolean),
    summary: generated.conversation_summary.trim(),
  };
}

class OpenAISDRAnalyzer implements SDRAnalyzer {
  async analyze(input: SDRAnalyzeInput): Promise<SDRAnalysisResult> {
    const fallback = new DeterministicSDRAnalyzer();

    try {
      const generated = await generateStructuredJSON<OpenAISDRAnalysis>({
        feature: "SDR reply analysis",
        maxOutputTokens: 1200,
        schema: openAISDRSchema,
        schemaName: "sdr_reply_analysis",
        system:
          "You classify inbound replies for a manual website preview sales workflow. Return only structured JSON matching the schema.",
        user: buildSDRPrompt(input),
      });

      return normalizeOpenAISDRResult(generated, input);
    } catch (error) {
      logSanitizedOpenAIError("SDR reply analysis", error);

      const deterministic = await fallback.analyze(input);

      return {
        ...deterministic,
        adminNotes:
          error instanceof Error
            ? `OpenAI SDR analysis failed; deterministic fallback used. ${error.message}`
            : "OpenAI SDR analysis failed; deterministic fallback used.",
        safetyFlags: [
          ...(deterministic.safetyFlags ?? []),
          "openai_fallback_used",
        ],
      };
    }
  }
}

export function getSDRAnalyzer(): SDRAnalyzer {
  const config = getAIConfig();
  const useOpenAI = config.sdrUsesOpenAI;

  if (useOpenAI) {
    return new OpenAISDRAnalyzer();
  }

  return new DeterministicSDRAnalyzer();
}

export function isHotSDRIntent(intent: SDRIntent) {
  return HOT_INTENTS.includes(intent);
}
