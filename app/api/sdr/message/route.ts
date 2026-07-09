import { jsonError, jsonOk, sanitizeServerError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";
import { verifyApiSecret } from "@/lib/security/api-auth";
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

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function POST(request: Request) {
  const secret = verifyApiSecret({
    configuredSecret: getServerEnv().sdrApiSecret,
    headerName: "x-sdr-secret",
    request,
  });

  if (!secret.ok) {
    return jsonError(secret.message, secret.status);
  }

  let payload: SDRMessagePayload;

  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return jsonError("Request body must be a JSON object.", 400);
    }

    payload = body as SDRMessagePayload;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const message = stringValue(payload.message);

  if (!message) {
    return jsonError("message is required.", 400);
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

    return jsonOk(
      {
        conversation_id: result.conversation.id,
        detected_intent: result.analysis.intent,
        handoff_required: result.analysis.handoffRequired,
        lead_id: result.leadId,
        message_id: result.message.id,
        suggested_reply: result.analysis.reply.body,
      },
      201,
    );
  } catch (error) {
    return jsonError(sanitizeServerError(error), 500);
  }
}
