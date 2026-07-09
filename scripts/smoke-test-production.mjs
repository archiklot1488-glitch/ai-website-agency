#!/usr/bin/env node

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const cliBaseUrl = args.find((arg) => !arg.startsWith("--"));
const rawBaseUrl =
  cliBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
const allowUnhealthy =
  flags.has("--allow-unhealthy") || process.env.SMOKE_ALLOW_UNHEALTHY === "true";

function normalizeBaseUrl(value) {
  if (!value) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;
  const parsed = new URL(candidate);

  return parsed.toString().replace(/\/$/, "");
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function okStatus(status) {
  return status >= 200 && status < 400;
}

function fail(message) {
  console.error(`[fail] ${message}`);
  process.exitCode = 1;
}

if (!rawBaseUrl) {
  fail(
    "Missing base URL. Pass one as an argument or set APP_BASE_URL/NEXT_PUBLIC_APP_URL.",
  );
  process.exit();
}

let baseUrl = null;

try {
  baseUrl = normalizeBaseUrl(rawBaseUrl);
} catch {
  fail("Invalid base URL.");
  process.exit();
}

if (!baseUrl) {
  fail("Invalid base URL.");
  process.exit();
}

console.log(`Production smoke test target: ${baseUrl}`);

try {
  const homeUrl = new URL("/", baseUrl);
  const homeResponse = await fetchWithTimeout(homeUrl);

  if (okStatus(homeResponse.status)) {
    console.log(`[ok] GET / -> ${homeResponse.status}`);
  } else {
    fail(`GET / returned ${homeResponse.status}`);
  }

  const healthUrl = new URL("/api/health", baseUrl);
  const healthResponse = await fetchWithTimeout(healthUrl);
  const contentType = healthResponse.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const healthBody = isJson ? await healthResponse.json() : null;
  const healthOk =
    healthResponse.status === 200 &&
    healthBody &&
    typeof healthBody === "object" &&
    healthBody.ok === true;

  if (healthOk) {
    console.log("[ok] GET /api/health -> ready");
  } else if (allowUnhealthy && isJson) {
    console.warn(
      `[warn] GET /api/health -> ${healthResponse.status}; endpoint responded but app is not healthy`,
    );
  } else {
    fail(
      `GET /api/health returned ${healthResponse.status} with ok=${String(
        healthBody?.ok,
      )}`,
    );
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Smoke test request failed.");
}

if (process.exitCode && process.exitCode > 0) {
  console.error("Production smoke test failed.");
} else {
  console.log("Production smoke test passed.");
}
