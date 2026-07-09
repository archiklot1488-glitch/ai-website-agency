# Production Deployment

This guide prepares AI Website Agency Automation for Vercel with Supabase. For
the Phase 11 launch workflow, use
[`docs/vercel-deployment-runbook.md`](vercel-deployment-runbook.md) and
[`docs/production-launch-checklist.md`](production-launch-checklist.md).

## Vercel Deployment

1. Push the repository branch to GitHub.
2. Create a new Vercel project from the repository.
3. Use the default Next.js framework settings.
4. Add the production environment variables listed below.
5. Deploy.
6. Open `/api/health` and `/admin/production` after deployment.

## Supabase Production Setup

1. Create a production Supabase project.
2. Open the Supabase SQL Editor.
3. Run `database/schema.sql` for a fresh project.
4. For an existing project, run each migration in `database/migrations/` in phase order.
5. Keep Row Level Security enabled.
6. Use the service role key only as a server-side Vercel environment variable.

## Required Environment Variables

Set these in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
HANDOFF_API_SECRET=
SDR_API_SECRET=
APP_BASE_URL=
NEXT_PUBLIC_APP_URL=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`,
`HANDOFF_API_SECRET`, or `SDR_API_SECRET` in client-side code.

## Optional Environment Variables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
DEV_MOCK_AI=true
DEV_MOCK_PLACES=true
DEV_MOCK_SDR=true
SDR_USE_OPENAI=false
```

`GOOGLE_MAPS_API_KEY` is kept as a backward-compatible fallback. Prefer
`GOOGLE_PLACES_API_KEY` for new deployments.

## Local Dev Versus Production

Local development can use mock modes:

```bash
DEV_MOCK_AI=true
DEV_MOCK_PLACES=true
DEV_MOCK_SDR=true
SDR_USE_OPENAI=false
```

Production can still use mocks during staged testing, but `/admin/production`
will show warnings when production mock modes are enabled.

## Running Migrations

For fresh Supabase projects, run:

```sql
-- database/schema.sql
```

For existing projects, run migration files in phase order:

```sql
-- database/migrations/phase4-lead-finder.sql
-- database/migrations/phase6-client-preview-package.sql
-- database/migrations/phase7-sales-handoff-pipeline.sql
-- database/migrations/phase8-outreach-assistant.sql
-- database/migrations/phase9-ai-sdr-handoff-core.sql
```

Phase 10 does not add a database migration.

## Verify Health

Open:

```text
/api/health
```

Expected production response:

```json
{
  "ok": true,
  "app": "ready",
  "database": "ready"
}
```

If database connectivity fails, the route returns HTTP `503` and safe JSON. It
does not expose secrets, connection strings, or stack traces.

## Verify Admin Login

1. Open `/admin`.
2. Sign in with `ADMIN_PASSWORD`.
3. Open `/admin/production`.
4. Confirm required secrets are marked configured and database connectivity is
   ready.

## Test Handoff API

```bash
curl -X POST https://your-domain.example/api/handoff \
  -H "Content-Type: application/json" \
  -H "x-handoff-secret: $HANDOFF_API_SECRET" \
  -d '{
    "website_slug": "your-generated-slug",
    "name": "Alex Client",
    "email": "alex@example.com",
    "message": "Interested in the preview.",
    "priority": "high"
  }'
```

The route returns `401` for a missing or invalid secret and never reveals the
expected value.

## Test SDR API

```bash
curl -X POST https://your-domain.example/api/sdr/message \
  -H "Content-Type: application/json" \
  -H "x-sdr-secret: $SDR_API_SECRET" \
  -d '{
    "website_slug": "your-generated-slug",
    "client_name": "Alex Client",
    "client_email": "alex@example.com",
    "channel": "api",
    "message": "How much would it cost to launch this?"
  }'
```

The route stores the inbound message, analyzes intent, returns a suggested reply,
and does not send anything externally.

## Avoid Committing Local Secrets

Keep local secrets in `.env.local`. Do not commit `.env.local` or paste real
secret values into source files, README examples, screenshots, issue comments, or
pull requests.

## Rotate Secrets

Rotate secrets after team changes, suspected leaks, or environment transfers:

1. Generate a new secret value.
2. Update the Vercel environment variable.
3. Redeploy.
4. Update any trusted integration using that secret.
5. Remove the old value from password managers and local `.env.local` files.

## Post-Deploy Checklist

- `/api/health` returns `ok: true`.
- `/admin` login works.
- `/admin/production` shows required secrets configured.
- Database connectivity is ready.
- Admin and preview pages are noindex.
- `/api/handoff` rejects bad secrets and accepts the configured secret.
- `/api/sdr/message` rejects bad secrets and accepts the configured secret.
- Mock modes are intentionally configured for the deployment stage.
- No real secrets are committed to git.
