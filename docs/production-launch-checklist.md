# Production Launch Checklist

Use this checklist for a real Vercel launch.

## Pre-Deploy

- [ ] Main branch is clean.
- [ ] `npm run verify` passes locally or in CI.
- [ ] Supabase schema and migrations are applied.
- [ ] Supabase RLS and security settings are reviewed.
- [ ] Vercel project is connected to the GitHub repository.
- [ ] Required environment variables are configured in Vercel.
- [ ] Optional mock-mode variables are intentionally configured.
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
- [ ] Open `/admin/lead-finder` and confirm provider mode.
- [ ] If using real Google Places, run a small lead query with max results `5`.
- [ ] Import one lead candidate and verify duplicate handling is acceptable.
- [ ] Open the preview link.
- [ ] Set the generated site live in Supabase.
- [ ] Open `/site/[slug]`.
- [ ] Test `/api/handoff`.
- [ ] Test `/api/sdr/message`.
- [ ] Verify a hot lead appears in `/admin/leads`.
- [ ] Run `APP_BASE_URL=https://YOUR_DOMAIN.com npm run smoke:prod`.

## Rollback

- [ ] Use Vercel's previous deployment rollback if production is unhealthy.
- [ ] Rotate exposed secrets if needed.
- [ ] Check Supabase for test data that needs cleanup.
- [ ] Set `DEV_MOCK_PLACES=true` and redeploy if Google quota or billing blocks launch.
- [ ] Re-run `/api/health` and `/admin/production` after rollback.
- [ ] Document what failed before attempting a new deployment.
