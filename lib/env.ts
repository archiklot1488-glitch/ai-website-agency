import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ReadinessStatus = "ready" | "missing" | "optional" | "warning";

export type DeploymentReadinessItem = {
  detail: string;
  key: string;
  label: string;
  status: ReadinessStatus;
};

export type DeploymentReadiness = {
  database: DeploymentReadinessItem;
  deployment: VercelDeploymentInfo;
  environmentName: string;
  isReady: boolean;
  items: DeploymentReadinessItem[];
};

export type VercelDeploymentInfo = {
  appBaseUrlConfigured: boolean;
  deploymentUrlDetected: boolean;
  isVercel: boolean;
  nextPublicAppUrlConfigured: boolean;
  productionUrlDetected: boolean;
  vercelEnvironment: string;
};

const REQUIRED_SERVER_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "HANDOFF_API_SECRET",
  "SDR_API_SECRET",
  "APP_BASE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const;

function raw(name: string) {
  return process.env[name]?.trim() || "";
}

function configured(name: string) {
  return raw(name).length > 0;
}

function boolEnv(name: string, defaultValue: boolean) {
  const value = raw(name).toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
}

function configuredDetail(name: string) {
  return configured(name) ? "configured" : "missing";
}

function item(
  key: string,
  label: string,
  status: ReadinessStatus,
  detail: string,
): DeploymentReadinessItem {
  return {
    detail,
    key,
    label,
    status,
  };
}

export function getServerEnv() {
  const googlePlacesApiKey = raw("GOOGLE_PLACES_API_KEY") || raw("GOOGLE_MAPS_API_KEY");

  return {
    adminPassword: raw("ADMIN_PASSWORD"),
    appBaseUrl: raw("APP_BASE_URL"),
    devMockAi: boolEnv("DEV_MOCK_AI", true),
    devMockPlaces: boolEnv("DEV_MOCK_PLACES", true),
    devMockSdr: boolEnv("DEV_MOCK_SDR", true),
    googlePlacesApiKey,
    handoffApiSecret: raw("HANDOFF_API_SECRET"),
    nextPublicAppUrl: raw("NEXT_PUBLIC_APP_URL"),
    nodeEnv: raw("NODE_ENV") || "development",
    openAiApiKey: raw("OPENAI_API_KEY"),
    sdrApiSecret: raw("SDR_API_SECRET"),
    sdrUseOpenAi: boolEnv("SDR_USE_OPENAI", false),
    supabaseAnonKey: raw("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: raw("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: raw("NEXT_PUBLIC_SUPABASE_URL"),
  };
}

export function getVercelDeploymentInfo(): VercelDeploymentInfo {
  const vercelEnvironment = raw("VERCEL_ENV");
  const deploymentUrl = raw("VERCEL_URL") || raw("VERCEL_BRANCH_URL");
  const productionUrl = raw("VERCEL_PROJECT_PRODUCTION_URL");

  return {
    appBaseUrlConfigured: configured("APP_BASE_URL"),
    deploymentUrlDetected: deploymentUrl.length > 0,
    isVercel:
      raw("VERCEL") === "1" ||
      vercelEnvironment.length > 0 ||
      deploymentUrl.length > 0 ||
      productionUrl.length > 0,
    nextPublicAppUrlConfigured: configured("NEXT_PUBLIC_APP_URL"),
    productionUrlDetected: productionUrl.length > 0,
    vercelEnvironment: vercelEnvironment || "not detected",
  };
}

export function getPublicEnvStatus() {
  const env = getServerEnv();
  const deployment = getVercelDeploymentInfo();

  return {
    adminPassword: configuredDetail("ADMIN_PASSWORD"),
    appBaseUrl: configuredDetail("APP_BASE_URL"),
    devMockAi: env.devMockAi ? "enabled" : "disabled",
    devMockPlaces: env.devMockPlaces ? "enabled" : "disabled",
    devMockSdr: env.devMockSdr ? "enabled" : "disabled",
    googlePlacesApiKey: env.googlePlacesApiKey ? "configured" : "missing",
    handoffApiSecret: configuredDetail("HANDOFF_API_SECRET"),
    nodeEnv: env.nodeEnv,
    openAiApiKey: configuredDetail("OPENAI_API_KEY"),
    sdrApiSecret: configuredDetail("SDR_API_SECRET"),
    sdrUseOpenAi: env.sdrUseOpenAi ? "enabled" : "disabled",
    supabaseAnonKey: configuredDetail("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: configuredDetail("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: configuredDetail("NEXT_PUBLIC_SUPABASE_URL"),
    nextPublicAppUrl: configuredDetail("NEXT_PUBLIC_APP_URL"),
    vercelDeploymentUrl: deployment.deploymentUrlDetected ? "detected" : "not detected",
    vercelEnvironment: deployment.vercelEnvironment,
    vercelProjectProductionUrl: deployment.productionUrlDetected
      ? "detected"
      : "not detected",
    vercelRuntime: deployment.isVercel ? "detected" : "not detected",
  };
}

export function assertRequiredServerEnv() {
  const missing = REQUIRED_SERVER_ENV.filter((name) => !configured(name));

  if (missing.length > 0) {
    throw new Error(
      `Missing required server environment variables: ${missing.join(", ")}`,
    );
  }
}

function requiredEnvItems(): DeploymentReadinessItem[] {
  return [
    item(
      "NEXT_PUBLIC_SUPABASE_URL",
      "Supabase URL",
      configured("NEXT_PUBLIC_SUPABASE_URL") ? "ready" : "missing",
      configuredDetail("NEXT_PUBLIC_SUPABASE_URL"),
    ),
    item(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "Supabase anon key",
      configured("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "ready" : "missing",
      configuredDetail("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    ),
    item(
      "SUPABASE_SERVICE_ROLE_KEY",
      "Supabase service role key",
      configured("SUPABASE_SERVICE_ROLE_KEY") ? "ready" : "missing",
      configuredDetail("SUPABASE_SERVICE_ROLE_KEY"),
    ),
    item(
      "ADMIN_PASSWORD",
      "Admin password",
      configured("ADMIN_PASSWORD") ? "ready" : "missing",
      configuredDetail("ADMIN_PASSWORD"),
    ),
    item(
      "HANDOFF_API_SECRET",
      "Handoff API secret",
      configured("HANDOFF_API_SECRET") ? "ready" : "missing",
      configuredDetail("HANDOFF_API_SECRET"),
    ),
    item(
      "SDR_API_SECRET",
      "SDR API secret",
      configured("SDR_API_SECRET") ? "ready" : "missing",
      configuredDetail("SDR_API_SECRET"),
    ),
    item(
      "APP_BASE_URL",
      "App base URL",
      configured("APP_BASE_URL") ? "ready" : "missing",
      configuredDetail("APP_BASE_URL"),
    ),
    item(
      "NEXT_PUBLIC_APP_URL",
      "Public app URL",
      configured("NEXT_PUBLIC_APP_URL") ? "ready" : "missing",
      configuredDetail("NEXT_PUBLIC_APP_URL"),
    ),
  ];
}

function modeItems(): DeploymentReadinessItem[] {
  const env = getServerEnv();
  const isProduction = env.nodeEnv === "production";
  const deployment = getVercelDeploymentInfo();

  return [
    item(
      "DEV_MOCK_AI",
      "Mock AI mode",
      isProduction && env.devMockAi ? "warning" : "optional",
      env.devMockAi ? "enabled" : "disabled",
    ),
    item(
      "DEV_MOCK_PLACES",
      "Mock Places mode",
      isProduction && env.devMockPlaces ? "warning" : "optional",
      env.devMockPlaces ? "enabled" : "disabled",
    ),
    item(
      "DEV_MOCK_SDR",
      "Mock SDR mode",
      isProduction && env.devMockSdr ? "warning" : "optional",
      env.devMockSdr ? "enabled" : "disabled",
    ),
    item(
      "SDR_USE_OPENAI",
      "SDR OpenAI mode",
      env.sdrUseOpenAi && !env.openAiApiKey ? "warning" : "optional",
      env.sdrUseOpenAi ? "enabled" : "disabled",
    ),
    item(
      "OPENAI_API_KEY",
      "OpenAI API key",
      env.openAiApiKey ? "ready" : env.devMockAi ? "optional" : "warning",
      env.openAiApiKey ? "configured" : "missing",
    ),
    item(
      "GOOGLE_PLACES_API_KEY",
      "Google Places API key",
      env.googlePlacesApiKey ? "ready" : env.devMockPlaces ? "optional" : "warning",
      env.googlePlacesApiKey ? "configured" : "missing",
    ),
    item(
      "VERCEL_ENV",
      "Vercel environment",
      deployment.isVercel ? "ready" : "optional",
      deployment.vercelEnvironment,
    ),
    item(
      "VERCEL_URL",
      "Vercel deployment URL",
      deployment.deploymentUrlDetected
        ? "ready"
        : deployment.isVercel
          ? "warning"
          : "optional",
      deployment.deploymentUrlDetected ? "detected" : "not detected",
    ),
    item("NODE_ENV", "Current NODE_ENV", "ready", env.nodeEnv),
  ];
}

export async function checkDatabaseConnectivity(): Promise<DeploymentReadinessItem> {
  const env = getServerEnv();

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return item(
      "database",
      "Database connectivity",
      "missing",
      "Supabase server credentials missing",
    );
  }

  try {
    const supabase = createClient<Database>(
      env.supabaseUrl,
      env.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    let error: Error | null = null;

    try {
      const result = await supabase
        .from("businesses")
        .select("id")
        .limit(1)
        .abortSignal(controller.signal);

      error = result.error;
    } finally {
      clearTimeout(timeout);
    }

    if (error) {
      return item("database", "Database connectivity", "warning", "check failed");
    }

    return item("database", "Database connectivity", "ready", "connected");
  } catch {
    return item("database", "Database connectivity", "warning", "check failed");
  }
}

export async function getDeploymentReadiness(): Promise<DeploymentReadiness> {
  const database = await checkDatabaseConnectivity();
  const deployment = getVercelDeploymentInfo();
  const items = [...requiredEnvItems(), ...modeItems(), database];
  const isReady = items.every((entry) => entry.status !== "missing");

  return {
    database,
    deployment,
    environmentName: getServerEnv().nodeEnv,
    isReady,
    items,
  };
}
