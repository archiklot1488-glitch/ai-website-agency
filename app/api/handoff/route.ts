import { jsonError, jsonOk, sanitizeServerError } from "@/lib/api/errors";
import { createBotHandoffLead } from "@/lib/deals";
import { getServerEnv } from "@/lib/env";
import { verifyApiSecret } from "@/lib/security/api-auth";
import { isLeadPriority, type LeadPriority } from "@/types/deals";

type HandoffPayload = {
  business_id?: unknown;
  conversation_summary?: unknown;
  deal_currency?: unknown;
  deal_value_cents?: unknown;
  email?: unknown;
  message?: unknown;
  name?: unknown;
  phone?: unknown;
  preferred_payment_method?: unknown;
  priority?: unknown;
  website_id?: unknown;
  website_slug?: unknown;
};

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function parseDealValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return {
      ok: false as const,
      error: "deal_value_cents must be a positive integer.",
    };
  }

  return {
    ok: true as const,
    value,
  };
}

function parsePriority(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "high";
  }

  if (typeof value !== "string" || !isLeadPriority(value)) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  const secret = verifyApiSecret({
    configuredSecret: getServerEnv().handoffApiSecret,
    headerName: "x-handoff-secret",
    request,
  });

  if (!secret.ok) {
    return jsonError(secret.message, secret.status);
  }

  let payload: HandoffPayload;

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return jsonError("Request body must be a JSON object.", 400);
    }

    payload = body as HandoffPayload;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const priority = parsePriority(payload.priority);

  if (!priority) {
    return jsonError("priority must be low, normal, or high.", 400);
  }

  const dealValue = parseDealValue(payload.deal_value_cents);

  if (!dealValue.ok) {
    return jsonError(dealValue.error, 400);
  }

  try {
    const lead = await createBotHandoffLead({
      businessId: stringValue(payload.business_id),
      conversationSummary: stringValue(payload.conversation_summary),
      dealCurrency: stringValue(payload.deal_currency) || "USD",
      dealValueCents: dealValue.value,
      email: stringValue(payload.email),
      message: stringValue(payload.message),
      name: stringValue(payload.name),
      phone: stringValue(payload.phone),
      preferredPaymentMethod: stringValue(payload.preferred_payment_method),
      priority: priority as LeadPriority,
      websiteId: stringValue(payload.website_id),
      websiteSlug: stringValue(payload.website_slug),
    });

    return jsonOk(
      {
        lead_id: lead.id,
        status: lead.status,
      },
      201,
    );
  } catch (error) {
    return jsonError(sanitizeServerError(error), 500);
  }
}
