export const OUTREACH_MESSAGE_TYPES = [
  "initial_preview",
  "follow_up_1",
  "follow_up_2",
  "reply_suggestion",
  "objection_response",
  "custom",
] as const;

export const OUTREACH_CHANNELS = [
  "email",
  "sms",
  "whatsapp",
  "phone",
  "manual",
] as const;

export const OUTREACH_DIRECTIONS = [
  "outbound",
  "inbound",
  "internal_note",
] as const;

export const OUTREACH_MESSAGE_STATUSES = [
  "draft",
  "copied",
  "sent_manual",
  "received_reply",
  "archived",
] as const;

export const REPLY_CATEGORIES = [
  "interested",
  "price_question",
  "needs_changes",
  "already_has_site",
  "not_interested",
  "unclear",
] as const;

export type OutreachMessageType = (typeof OUTREACH_MESSAGE_TYPES)[number];
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];
export type OutreachDirection = (typeof OUTREACH_DIRECTIONS)[number];
export type OutreachMessageStatus =
  (typeof OUTREACH_MESSAGE_STATUSES)[number];
export type ReplyCategory = (typeof REPLY_CATEGORIES)[number];

export function isOutreachMessageType(
  value: string,
): value is OutreachMessageType {
  return OUTREACH_MESSAGE_TYPES.includes(value as OutreachMessageType);
}

export function isOutreachChannel(value: string): value is OutreachChannel {
  return OUTREACH_CHANNELS.includes(value as OutreachChannel);
}

export function isReplyCategory(value: string): value is ReplyCategory {
  return REPLY_CATEGORIES.includes(value as ReplyCategory);
}
