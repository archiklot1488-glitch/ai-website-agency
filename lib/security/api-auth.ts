import "server-only";

import { timingSafeEqual } from "crypto";

type SecretVerificationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 401;
      message: string;
    };

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyApiSecret({
  configuredSecret,
  headerName,
  request,
}: {
  configuredSecret: string | null | undefined;
  headerName: string;
  request: Request;
}): SecretVerificationResult {
  const expected = configuredSecret?.trim() || null;
  const provided = request.headers.get(headerName)?.trim() || null;

  if (!expected || !provided || !safeCompare(provided, expected)) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
    };
  }

  return {
    ok: true,
  };
}
