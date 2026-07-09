import "server-only";

import { getServerEnv } from "@/lib/env";
import { createMissingOpenAIKeyError } from "@/lib/ai/openai-errors";

export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
export const DEFAULT_OPENAI_TIMEOUT_MS = 30000;
export const DEFAULT_OPENAI_MAX_OUTPUT_TOKENS = 4000;

export type AIConfig = {
  apiKey: string;
  devMockAi: boolean;
  devMockSdr: boolean;
  maxOutputTokens: number;
  model: string;
  outreachUseOpenAi: boolean;
  outreachUsesOpenAI: boolean;
  sdrUseOpenAi: boolean;
  sdrUsesOpenAI: boolean;
  timeoutMs: number;
  websiteUsesOpenAI: boolean;
};

export function getAIConfig(): AIConfig {
  const env = getServerEnv();

  return {
    apiKey: env.openAiApiKey,
    devMockAi: env.devMockAi,
    devMockSdr: env.devMockSdr,
    maxOutputTokens: env.openAiMaxOutputTokens,
    model: env.openAiModel,
    outreachUseOpenAi: env.outreachUseOpenAi,
    outreachUsesOpenAI: env.outreachUseOpenAi,
    sdrUseOpenAi: env.sdrUseOpenAi,
    sdrUsesOpenAI: !env.devMockSdr && env.sdrUseOpenAi,
    timeoutMs: env.openAiTimeoutMs,
    websiteUsesOpenAI: !env.devMockAi,
  };
}

export function requireOpenAIConfig(feature: string) {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw createMissingOpenAIKeyError(feature);
  }

  return config;
}
