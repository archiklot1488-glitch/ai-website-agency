export const LEAD_STATUSES = [
  "new",
  "interested",
  "needs_human",
  "contacted",
  "negotiating",
  "paid_manual",
  "launched",
  "lost",
] as const;

export const LEAD_PRIORITIES = ["low", "normal", "high"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}

export function isLeadPriority(value: string): value is LeadPriority {
  return LEAD_PRIORITIES.includes(value as LeadPriority);
}
