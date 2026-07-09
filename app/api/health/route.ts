import { getDeploymentReadiness } from "@/lib/env";
import { jsonOk } from "@/lib/api/errors";

export async function GET() {
  const readiness = await getDeploymentReadiness();
  const database = readiness.database;
  const ok = readiness.isReady && database.status === "ready";

  return jsonOk(
    {
      app: ok ? "ready" : "not_ready",
      database: database.status,
      environment: readiness.environmentName,
      ok,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    },
    ok ? 200 : 503,
  );
}
