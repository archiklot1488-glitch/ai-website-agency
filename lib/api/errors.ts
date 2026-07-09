import "server-only";

import { NextResponse } from "next/server";

export function sanitizeServerError(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return "Unexpected server error.";
  }

  return error instanceof Error ? error.message : "Unexpected server error.";
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<TPayload>(payload: TPayload, status = 200) {
  return NextResponse.json(payload, { status });
}
