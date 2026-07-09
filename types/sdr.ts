import type { Business, Lead, SDRConversation, SDRMessage, Website } from "@/types/database";

export const SDR_INTENTS = [
  "interested",
  "price_question",
  "needs_changes",
  "wants_call",
  "already_has_website",
  "not_interested",
  "unclear",
  "spam",
] as const;

export const SDR_CONVERSATION_STATUSES = [
  "open",
  "needs_human",
  "closed",
  "archived",
] as const;

export const SDR_CHANNELS = [
  "manual",
  "email",
  "sms",
  "whatsapp",
  "website_chat",
  "api",
] as const;

export const SDR_MESSAGE_DIRECTIONS = [
  "inbound",
  "outbound_suggestion",
  "internal_note",
] as const;

export const SDR_SENDER_ROLES = ["client", "assistant", "admin", "system"] as const;

export type SDRIntent = (typeof SDR_INTENTS)[number];
export type SDRConversationStatus = (typeof SDR_CONVERSATION_STATUSES)[number];
export type SDRChannel = (typeof SDR_CHANNELS)[number];
export type SDRMessageDirection = (typeof SDR_MESSAGE_DIRECTIONS)[number];
export type SDRSenderRole = (typeof SDR_SENDER_ROLES)[number];

export type SDRReplySuggestion = {
  body: string;
  subject?: string;
};

export type SDRAnalysisResult = {
  adminNotes?: string;
  confidence: number;
  handoffRequired: boolean;
  intent: SDRIntent;
  reasoning: string;
  reply: SDRReplySuggestion;
  safetyFlags?: string[];
  summary: string;
};

export type SDRAnalyzeInput = {
  business: Business | null;
  conversation: SDRConversation | null;
  message: string;
  previousMessages?: SDRMessage[];
  website: Website | null;
};

export type SDRConversationWithRelations = SDRConversation & {
  business: Business | null;
  lead: Lead | null;
  latestMessage: SDRMessage | null;
  website: Website | null;
};

export function isSDRIntent(value: string): value is SDRIntent {
  return SDR_INTENTS.includes(value as SDRIntent);
}

export function isSDRConversationStatus(
  value: string,
): value is SDRConversationStatus {
  return SDR_CONVERSATION_STATUSES.includes(value as SDRConversationStatus);
}

export function isSDRChannel(value: string): value is SDRChannel {
  return SDR_CHANNELS.includes(value as SDRChannel);
}
