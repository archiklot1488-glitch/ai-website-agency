# Vercel Deployment Runbook

This runbook deploys AI Website Agency Automation to Vercel with a production
Supabase project. Phase 12.1 keeps mock mode available for the first deployment
and adds one nullable Lead Finder metadata migration.

## Deployment Approach

Use Vercel's default Next.js project detection. No custom `vercel.json` is
required for the current app because the dynamic admin, preview, live, and API
routes already declare dynamic behavior where needed.

Environment variables must be configured in the Vercel dashboard. Do not commit
`.env.local`, copy real secrets into GitHub, or paste service-role credentials
into docs, screenshots, issues, or pull requests.

## Required Vercel Environment Variables

Add these in Vercel Project Settings under Environment Variables:

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

Recommended URL values:

```bash
APP_BASE_URL=https://YOUR_DOMAIN.com
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN.com
```

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`NEXT_PUBLIC_APP_URL` are public browser values. Keep `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_PASSWORD`, `HANDOFF_API_SECRET`, and `SDR_API_SECRET` server-only.

## Optional Vercel Environment Variables

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_OUTPUT_TOKENS=4000
GOOGLE_PLACES_API_KEY=
DEV_MOCK_AI=true
DEV_MOCK_PLACES=true
DEV_MOCK_SDR=true
OUTREACH_USE_OPENAI=false
SDR_USE_OPENAI=false
```

Recommended initial production smoke-test values:

```bash
DEV_MOCK_AI=true
DEV_MOCK_PLACES=true
DEV_MOCK_SDR=true
OUTREACH_USE_OPENAI=false
SDR_USE_OPENAI=false
```

These values let the first deployment verify business creation, mock website
generation, mock lead finding, and mock SDR handling without OpenAI billing or a
Google Places key. After the deployment is healthy, switch real integrations on
deliberately:

```bash
DEV_MOCK_AI=false
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4.1-mini

DEV_MOCK_PLACES=false
GOOGLE_PLACES_API_KEY=your-google-places-key
```

OpenAI is server-only. `OPENAI_API_KEY` is required only when at least one real
OpenAI mode is enabled:

```bash
DEV_MOCK_AI=false             # real website generation
OUTREACH_USE_OPENAI=true      # real outreach drafts
DEV_MOCK_SDR=false
SDR_USE_OPENAI=true           # real SDR analysis
```

Otherwise keep `DEV_MOCK_AI=true`, `OUTREACH_USE_OPENAI=false`,
`DEV_MOCK_SDR=true`, and `SDR_USE_OPENAI=false` for mock/deterministic local
and smoke-test behavior. Review OpenAI billing/quota before enabling real modes
in production.

`OPENAI_TIMEOUT_MS` and `OPENAI_MAX_OUTPUT_TOKENS` provide cost and latency
controls. Start with the defaults unless production logs show a clear reason to
change them.

## Real Google Places Lead Finder

To enable real Lead Finder searches in Vercel:

```bash
GOOGLE_PLACES_API_KEY=your-google-places-key
DEV_MOCK_PLACES=false
```

Then redeploy the Vercel project. Runtime functions receive env var changes
only after a new deployment.

After redeploy:

1. Open `/admin/production`.
2. Confirm `DEV_MOCK_PLACES` is disabled.
3. Confirm `GOOGLE_PLACES_API_KEY` is configured.
4. Open `/admin/lead-finder`.
5. Run a small query such as `plumber` in `Austin` with max results `5`.
6. Import one candidate and confirm it appears in `/admin`.

Phase 12.1 maps common niches to supported Google `includedType` values and
sends `strictTypeFiltering=true` only when a mapping is available. Unsupported
niches, including cleaning/HVAC/landscaping/pest control, use text search plus
filtering and do not send invalid included types. If no mapping is found, the
admin UI shows a text-search warning. Results are filtered to reject streets,
addresses, routes, localities, political areas, permanently closed places, and
weak non-business records.

Google Places API may incur billing costs and can hit quota/rate limits. Lead
Finder caps searches at 20 results and uses a limited FieldMask for cost control:

```text
places.id,
places.displayName,
places.formattedAddress,
places.location,
places.businessStatus,
places.primaryType,
places.types,
places.googleMapsUri,
places.websiteUri,
places.nationalPhoneNumber,
places.internationalPhoneNumber,
places.rating,
places.userRatingCount
```

Do not use wildcard FieldMask values in production. Do not request photos,
review text, AI summaries, or atmosphere fields for lead searches.

## Supabase Production Setup

1. Create a production Supabase project.
2. Run `database/schema.sql` for a fresh database.
3. For an existing database, run migrations in phase order from
   `database/migrations/`.
4. Keep Row Level Security enabled.
5. Use the service role key only in Vercel server environment variables.

For existing Supabase databases, Phase 12.1 requires:

```sql
-- database/migrations/phase12-1-lead-search-metadata.sql
```

The migration adds nullable Lead Finder search metadata and does not drop
existing data.

## Deploy From GitHub To Vercel

1. Push or merge the deployment branch into `main`.
2. In Vercel, create a new project and import the GitHub repository.
3. Keep the default Next.js framework preset.
4. Confirm the production branch is `main`.
5. Add the required environment variables above.
6. Add the recommended mock-mode values for the first deployment.
7. Deploy and wait for the build to finish.
8. Open the deployment URL, then visit `/admin/production`.

If a Vercel build fails, check that no real local `.env.local` values were
committed and that all required dashboard variables are present.

## Post-Deploy Smoke Tests

From a local terminal after deployment:

```bash
APP_BASE_URL=https://YOUR_DOMAIN.com npm run smoke:prod
```

The smoke script checks only public safe endpoints:

- `GET /`
- `GET /api/health`

It does not test admin login automatically and does not require protected API
secrets.

For route-shape testing against a temporary environment that is expected to be
unhealthy, use:

```bash
SMOKE_ALLOW_UNHEALTHY=true APP_BASE_URL=https://YOUR_PREVIEW_DOMAIN.vercel.app npm run smoke:prod
```

Do not use `SMOKE_ALLOW_UNHEALTHY=true` as a final production readiness signal.

## Health API Test

```bash
curl -i https://YOUR_DOMAIN.com/api/health
```

A healthy deployment returns HTTP `200` and safe JSON with `ok: true`. If
configuration or database connectivity is incomplete, it returns HTTP `503` with
safe JSON and no secret values.

## Handoff API Smoke Test

Use a real `website_slug` from an existing generated website for a linked test.
If you do not have one yet, create a business in `/admin`, generate a mock
website, and copy the slug from the dashboard. You can also use `website_id` or
`business_id` in the JSON body for linked tests.

```bash
curl -i -X POST https://YOUR_DOMAIN.com/api/handoff \
  -H "Content-Type: application/json" \
  -H "x-handoff-secret: YOUR_HANDOFF_API_SECRET" \
  -d '{"website_slug":"test-slug","name":"Test Client","email":"test@example.com","message":"Interested in the preview.","conversation_summary":"Production smoke test.","priority":"high"}'
```

Expected behavior:

- Missing or wrong `x-handoff-secret` returns `401`.
- Valid requests create a hot lead for admin review.
- The route never sends outbound messages.

## SDR API Smoke Test

Use an existing `website_slug` for a linked test. If the slug does not exist,
create a generated website first or pass a known `website_id`/`business_id`.

```bash
curl -i -X POST https://YOUR_DOMAIN.com/api/sdr/message \
  -H "Content-Type: application/json" \
  -H "x-sdr-secret: YOUR_SDR_API_SECRET" \
  -d '{"website_slug":"test-slug","client_name":"Test Client","client_email":"test@example.com","channel":"api","message":"How much would it cost to launch this?"}'
```

Expected behavior:

- Missing or wrong `x-sdr-secret` returns `401`.
- Valid requests store the inbound message and return a suggested reply.
- In mock mode, no OpenAI request is made.
- The route never sends outbound messages.

## Secret Rotation

Rotate `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `HANDOFF_API_SECRET`, and
`SDR_API_SECRET` if they are exposed or shared too broadly:

1. Generate a new value.
2. Update it in Vercel.
3. Redeploy.
4. Update trusted local `.env.local` files or integrations.
5. Remove old values from password managers and local machines.

Never paste `.env.local` into GitHub or Vercel build logs.
