import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { processSDRInboundMessage } from "@/lib/sdr/conversations";

type SDRMessagePayload = {
  business_id?: unknown;
  channel?: unknown;
  client_email?: unknown;
  client_name?: unknown;
  client_phone?: unknown;
  conversation_id?: unknown;
  lead_id?: unknown;
  message?: unknown;
  website_id?: unknown;
  website_slug?: unknown;
};

function getSDRSecret() {
  return process.env.SDR_API_SECRET?.trim() || null;
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

export async function POST(request: Request) {
  const configuredSecret = getSDRSecret();
  const providedSecret = request.headers.get("x-sdr-secret")?.trim() || null;

  if (
    !configuredSecret ||
    !providedSecret ||
    !safeCompare(providedSecret, configuredSecret)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: SDRMessagePayload;

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    payload = body as SDRMessagePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = stringValue(payload.message);

  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const result = await processSDRInboundMessage({
      businessId: stringValue(payload.business_id),
      channel: stringValue(payload.channel) || "api",
      clientEmail: stringValue(payload.client_email),
      clientName: stringValue(payload.client_name),
      clientPhone: stringValue(payload.client_phone),
      conversationId: stringValue(payload.conversation_id),
      leadId: stringValue(payload.lead_id),
      message,
      websiteId: stringValue(payload.website_id),
      websiteSlug: stringValue(payload.website_slug),
    });

    return NextResponse.json(
      {
        conversation_id: result.conversation.id,
        detected_intent: result.analysis.intent,
        handoff_required: result.analysis.handoffRequired,
        lead_id: result.leadId,
        message_id: result.message.id,
        suggested_reply: result.analysis.reply.body,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "SDR message could not be processed.",
      },
      { status: 400 },
    );
  }
}
