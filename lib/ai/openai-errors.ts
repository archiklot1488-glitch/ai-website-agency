import "server-only";

export type OpenAIProviderErrorCode =
  | "invalid_json"
  | "missing_api_key"
  | "network_error"
  | "quota_exceeded"
  | "rate_limited"
  | "request_rejected"
  | "schema_validation_failed"
  | "timeout"
  | "unknown";

export class OpenAIProviderError extends Error {
  code: OpenAIProviderErrorCode;
  status?: number;

  constructor(
    code: OpenAIProviderErrorCode,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "OpenAIProviderError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function sanitizeOpenAIErrorMessage(message: string) {
  return message
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/OPENAI_API_KEY=[^\s]+/g, "OPENAI_API_KEY=[redacted]");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return sanitizeOpenAIErrorMessage(error.message);
  }

  if (typeof error === "string") {
    return sanitizeOpenAIErrorMessage(error);
  }

  if (isRecord(error)) {
    return sanitizeOpenAIErrorMessage(stringValue(error.message));
  }

  return "";
}

function errorStatus(error: unknown) {
  if (!isRecord(error)) {
    return undefined;
  }

  return (
    numberValue(error.status) ??
    numberValue(error.statusCode) ??
    numberValue(error.code)
  );
}

function errorCode(error: unknown) {
  if (!isRecord(error)) {
    return "";
  }

  return `${stringValue(error.code)} ${stringValue(error.type)}`.toLowerCase();
}

export function createMissingOpenAIKeyError(feature: string) {
  return new OpenAIProviderError(
    "missing_api_key",
    `OPENAI_API_KEY is required for ${feature}. Configure it or keep the related mock/disabled mode enabled.`,
  );
}

export function toOpenAIProviderError(error: unknown, feature: string) {
  if (error instanceof OpenAIProviderError) {
    return error;
  }

  const message = errorMessage(error);
  const lowered = `${message} ${errorCode(error)}`.toLowerCase();
  const status = errorStatus(error);

  if (
    lowered.includes("timeout") ||
    lowered.includes("timed out") ||
    lowered.includes("aborted")
  ) {
    return new OpenAIProviderError(
      "timeout",
      `${feature} timed out while waiting for OpenAI. Try again or increase OPENAI_TIMEOUT_MS.`,
      status,
    );
  }

  if (
    lowered.includes("quota") ||
    lowered.includes("billing") ||
    lowered.includes("insufficient_quota")
  ) {
    return new OpenAIProviderError(
      "quota_exceeded",
      `${feature} could not use OpenAI because quota or billing is unavailable.`,
      status,
    );
  }

  if (status === 429 || lowered.includes("rate limit")) {
    return new OpenAIProviderError(
      "rate_limited",
      `${feature} was rate limited by OpenAI. Please wait and try again.`,
      status,
    );
  }

  if (status === 400 || status === 401 || status === 403) {
    return new OpenAIProviderError(
      "request_rejected",
      `${feature} was rejected by OpenAI: ${message || "check model, API key, and request settings."}`,
      status,
    );
  }

  if (
    lowered.includes("fetch") ||
    lowered.includes("network") ||
    lowered.includes("connection")
  ) {
    return new OpenAIProviderError(
      "network_error",
      `${feature} could not reach OpenAI. Check network access and try again.`,
      status,
    );
  }

  return new OpenAIProviderError(
    "unknown",
    message ? `${feature} failed: ${message}` : `${feature} failed.`,
    status,
  );
}

export function logSanitizedOpenAIError(feature: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const providerError = toOpenAIProviderError(error, feature);

  console.warn("[OpenAI]", feature, {
    code: providerError.code,
    message: providerError.message,
    status: providerError.status,
  });
}
