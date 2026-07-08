export const OUTREACH_STATUSES = [
  "not_sent",
  "ready_to_send",
  "sent",
  "followed_up",
  "interested",
  "not_interested",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export function isOutreachStatus(value: string): value is OutreachStatus {
  return OUTREACH_STATUSES.includes(value as OutreachStatus);
}
