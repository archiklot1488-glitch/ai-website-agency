import "server-only";

import OpenAI from "openai";
import { requireOpenAIConfig } from "@/lib/ai/ai-config";
import {
  OpenAIProviderError,
  toOpenAIProviderError,
} from "@/lib/ai/openai-errors";

type StructuredJsonInput = {
  feature: string;
  maxOutputTokens?: number;
  schema: Record<string, unknown>;
  schemaName: string;
  system: string;
  user: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractResponseText(response: unknown) {
  if (!isRecord(response)) {
    return null;
  }

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  if (!Array.isArray(response.output)) {
    return null;
  }

  for (const outputItem of response.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        isRecord(contentItem) &&
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

export async function generateStructuredJSON<T>(
  input: StructuredJsonInput,
): Promise<T> {
  const config = requireOpenAIConfig(input.feature);
  const client = new OpenAI({
    apiKey: config.apiKey,
    maxRetries: 0,
    timeout: config.timeoutMs,
  });

  try {
    const response = await client.responses.create({
      model: config.model,
      input: [
        {
          role: "system",
          content: input.system,
        },
        {
          role: "user",
          content: input.user,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          schema: input.schema,
          strict: true,
        },
      },
      store: false,
      max_output_tokens: Math.min(
        input.maxOutputTokens ?? config.maxOutputTokens,
        config.maxOutputTokens,
      ),
    });
    const text = extractResponseText(response);

    if (!text) {
      throw new OpenAIProviderError(
        "invalid_json",
        `${input.feature} did not return structured JSON.`,
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new OpenAIProviderError(
        "invalid_json",
        `${input.feature} returned invalid JSON.`,
      );
    }
  } catch (error) {
    throw toOpenAIProviderError(error, input.feature);
  }
}
