# Production Launch Checklist

Use this checklist for a real Vercel launch.

## Pre-Deploy

- [ ] Main branch is clean.
- [ ] `npm run verify` passes locally or in CI.
- [ ] Supabase schema and migrations are applied.
- [ ] Phase 12.1 metadata migration is applied for existing databases.
- [ ] Supabase RLS and security settings are reviewed.
- [ ] Vercel project is connected to the GitHub repository.
- [ ] Required environment variables are configured in Vercel.
- [ ] Optional mock-mode variables are intentionally configured.
- [ ] `OPENAI_API_KEY` is configured if real website, outreach, or SDR OpenAI modes are enabled.
- [ ] OpenAI billing/quota and model choice are reviewed before real generation.
- [ ] `GOOGLE_PLACES_API_KEY` is configured if `DEV_MOCK_PLACES=false`.
- [ ] Google Places billing/quota limits are reviewed before real searches.
- [ ] Production branch is set to `main`.
- [ ] No `.env.local` or real secrets are committed.

## Deploy

- [ ] Push or merge to `main`.
- [ ] Wait for the Vercel build to complete.
- [ ] Check Vercel build logs for errors or missing env warnings.
- [ ] Open the deployment URL.
- [ ] Confirm the deployment domain is the expected production or preview URL.

## Post-Deploy Smoke Tests

- [ ] Open `/`.
- [ ] Open `/admin`.
- [ ] Log in with `ADMIN_PASSWORD`.
- [ ] Open `/admin/production`.
- [ ] Call `/api/health`.
- [ ] Create a test business.
- [ ] Generate a mock website.
- [ ] If `DEV_MOCK_AI=false`, generate one real OpenAI website and verify valid
      structured JSON is saved.
- [ ] If `OUTREACH_USE_OPENAI=true`, open a website outreach page and confirm
      drafts are generated for manual review only.
- [ ] Open `/admin/lead-finder` and confirm provider mode.
- [ ] If using real Google Places, run a small lead query with max results `5`.
- [ ] Confirm Lead Finder shows resolved type, strict filtering, raw count,
      filtered count, and saved count.
- [ ] Import one lead candidate and verify duplicate handling is acceptable.
- [ ] Open the preview link.
- [ ] Set the generated site live in Supabase.
- [ ] Open `/site/[slug]`.
- [ ] Test `/api/handoff`.
- [ ] Test `/api/sdr/message`.
- [ ] If `DEV_MOCK_SDR=false` and `SDR_USE_OPENAI=true`, confirm SDR analysis
      still falls back safely if OpenAI quota or rate limits are unavailable.
- [ ] Verify a hot lead appears in `/admin/leads`.
- [ ] Run `APP_BASE_URL=https://YOUR_DOMAIN.com npm run smoke:prod`.

## Rollback

- [ ] Use Vercel's previous deployment rollback if production is unhealthy.
- [ ] Rotate exposed secrets if needed.
- [ ] Check Supabase for test data that needs cleanup.
- [ ] Set `DEV_MOCK_PLACES=true` and redeploy if Google quota or billing blocks launch.
- [ ] Re-run `/api/health` and `/admin/production` after rollback.
- [ ] Document what failed before attempting a new deployment.
