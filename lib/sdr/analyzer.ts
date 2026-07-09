import "server-only";

import type {
  SDRAnalysisResult,
  SDRAnalyzeInput,
  SDRIntent,
} from "@/types/sdr";

type SDRAnalyzer = {
  analyze(input: SDRAnalyzeInput): Promise<SDRAnalysisResult>;
};

const HOT_INTENTS: SDRIntent[] = [
  "interested",
  "price_question",
  "needs_changes",
  "wants_call",
];

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

class FutureOpenAISDRAnalyzer implements SDRAnalyzer {
  async analyze(input: SDRAnalyzeInput): Promise<SDRAnalysisResult> {
    return new DeterministicSDRAnalyzer().analyze(input);
  }
}

export function getSDRAnalyzer(): SDRAnalyzer {
  const useOpenAI = process.env.SDR_USE_OPENAI === "true";

  if (useOpenAI) {
    return new FutureOpenAISDRAnalyzer();
  }

  return new DeterministicSDRAnalyzer();
}

export function isHotSDRIntent(intent: SDRIntent) {
  return HOT_INTENTS.includes(intent);
}
