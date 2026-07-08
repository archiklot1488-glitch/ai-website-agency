import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createBotHandoffLead } from "@/lib/deals";
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

function getHandoffSecret() {
  return process.env.HANDOFF_API_SECRET?.trim() || null;
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

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
  const configuredSecret = getHandoffSecret();
  const providedSecret = request.headers.get("x-handoff-secret")?.trim() || null;

  if (
    !configuredSecret ||
    !providedSecret ||
    !safeCompare(providedSecret, configuredSecret)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: HandoffPayload;

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    payload = body as HandoffPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const priority = parsePriority(payload.priority);

  if (!priority) {
    return NextResponse.json(
      { error: "priority must be low, normal, or high." },
      { status: 400 },
    );
  }

  const dealValue = parseDealValue(payload.deal_value_cents);

  if (!dealValue.ok) {
    return NextResponse.json({ error: dealValue.error }, { status: 400 });
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

    return NextResponse.json(
      {
        lead_id: lead.id,
        status: lead.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Handoff lead could not be created.",
      },
      { status: 400 },
    );
  }
}
