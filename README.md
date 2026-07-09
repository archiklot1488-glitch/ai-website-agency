# AI Website Agency Automation

Phase 1 foundation for an admin-led workflow that stores small business intake
details before future phases add AI-generated website previews, client preview
links, payment unlocks, and live website publishing.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/Postgres
- OpenAI Responses API for structured website JSON generation

The current phases intentionally do not include Stripe, automatic email/SMS
outreach, autonomous SDR workflows, payments, or custom domains.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project.

3. Run the SQL in `database/schema.sql` in the Supabase SQL editor.

4. Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ADMIN_PASSWORD=

   OPENAI_API_KEY=
   GOOGLE_PLACES_API_KEY=

   DEV_MOCK_AI=true
   DEV_MOCK_PLACES=true
   DEV_MOCK_SDR=true
   SDR_USE_OPENAI=false

   HANDOFF_API_SECRET=
   SDR_API_SECRET=

   NEXT_PUBLIC_APP_URL=
   APP_BASE_URL=

   OPENAI_MODEL=gpt-4.1-mini
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000/admin` and sign in with `ADMIN_PASSWORD`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run verify
```

## Phase 1 Features

- Password-protected `/admin` dashboard using `ADMIN_PASSWORD`
- Business creation form
- Business list with status and created date
- Typed Supabase browser and server helpers
- Supabase schema for `businesses`, `websites`, `leads`, and `payments`

## Phase 2 Features

- Admin-only website generation action
- Structured OpenAI JSON output stored in `websites.website_json`
- Lightweight validation before saving generated content
- Unique business-based website slugs and preview tokens
- Website status, slug, and Phase 3 preview-link placeholder in the dashboard
- Development mock mode for website generation without OpenAI billing

## Local AI Testing

Set `DEV_MOCK_AI=true` in `.env.local` to test website generation without making
OpenAI API requests:

```bash
DEV_MOCK_AI=true
```

Mock mode creates deterministic structured website JSON from the saved business
record, validates it with the same validator, then stores it in
`websites.website_json` with `status = preview`, a generated slug, and a preview
token.

Use `OPENAI_API_KEY` only when you want real AI generation:

```bash
DEV_MOCK_AI=false
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

## Phase 3 Features

- Safe React renderer for generated website JSON
- Preview route at `/preview/[slug]?token=[preview_token]`
- Live route at `/site/[slug]`
- Preview banner and disabled preview contact form
- Live contact form that stores submissions in `leads`
- Admin links for preview pages and live sites

## Preview And Live Testing

1. Set `DEV_MOCK_AI=true` in `.env.local`.
2. Create a business in `/admin`.
3. Click `Generate Website`.
4. Use the preview link shown in the dashboard:

   ```text
   /preview/[slug]?token=[preview_token]
   ```

5. Confirm the preview page renders with a visible preview banner and disabled
   contact form.

To test the live route locally, manually update the generated website row in
Supabase:

```sql
update public.websites
set status = 'live', is_live = true
where slug = 'your-generated-slug';
```

Then open:

```text
/site/[slug]
```

The live page should render without the preview banner. Submitting the contact
form should create a row in `public.leads`.

## Phase 4 Features

- Admin-controlled Lead Finder at `/admin/lead-finder`
- Provider abstraction for local business search
- Deterministic mock places provider for local development
- Google Places Text Search adapter for real searches
- Lead scoring and qualification
- Candidate import into the existing `businesses` table

## Lead Finder Testing

For local development without Google billing, set:

```bash
DEV_MOCK_PLACES=true
```

Then:

1. Open `/admin/lead-finder`.
2. Search for `cleaning service` in `Austin`.
3. Import a candidate.
4. Open `/admin` and confirm the imported business appears.
5. Manually click `Generate Website` when you are ready to create a preview.

Mock mode does not call Google and does not require `GOOGLE_PLACES_API_KEY`.

## Real Google Places Setup

To use real Google Places searches:

```bash
DEV_MOCK_PLACES=false
GOOGLE_PLACES_API_KEY=your-google-api-key
```

Enable the Places API in Google Cloud for that key. Google calls happen only on
the server through the Lead Finder provider adapter. The app uses Places Text
Search (New) with a minimal field mask and does not scrape Google Maps pages.

## Supabase Migration

For an existing Supabase database, run:

```sql
-- database/migrations/phase4-lead-finder.sql
-- database/migrations/phase6-client-preview-package.sql
-- database/migrations/phase7-sales-handoff-pipeline.sql
-- database/migrations/phase8-outreach-assistant.sql
-- database/migrations/phase9-ai-sdr-handoff-core.sql
```

The migration adds nullable source fields to `businesses`, creates
`lead_searches` and `lead_candidates`, and adds indexes without dropping
existing data. The Phase 6 migration adds offer tracking fields to `websites`
without dropping existing data. The Phase 7 migration adds deal tracking fields
to `leads` without dropping existing data. The Phase 8 migration creates
`outreach_messages` without dropping existing data. The Phase 9 migration
creates SDR conversation/message tables without dropping existing data.

## Phase 5 Features

- Admin website editor at `/admin/websites/[id]/edit`
- Structured editing for brand, hero, services, about, bullets, FAQ, contact,
  and SEO content
- Quality checklist stored under `website_json.admin.checklist`
- Preview and live links from the editor
- Dashboard `Edit Website` links for generated websites

## Website Editor Testing

1. Create or import a business in `/admin`.
2. Click `Generate Website`.
3. Click `Edit Website` in the business table.
4. Modify the hero, services, FAQ, or contact fields.
5. Update the quality checklist.
6. Click `Save website`.
7. Open the preview link and confirm the changes render immediately.

The editor saves structured JSON back to `websites.website_json`. It does not
render or store arbitrary HTML.

## Phase 6 Features

- Admin offer package page at `/admin/websites/[id]/offer`
- Deterministic local preview and follow-up message generation
- Editable client message, follow-up message, offer price, notes, currency, and
  outreach status
- Copy buttons for the preview link and both messages
- Manual `Mark Preview Sent` action that stores `preview_sent_at` and sets
  `outreach_status = sent`
- Dashboard offer links and outreach status tracking

## Client Preview Package Testing

1. Create or import a business in `/admin`.
2. Click `Generate Website`.
3. Click `Edit Website`, make any needed edits, and save.
4. Click `Offer / Send Preview` in the business table.
5. Set an offer price in cents, add notes, and review the generated messages.
6. Copy the preview link, client message, or follow-up message.
7. Click `Mark Preview Sent`.
8. Return to `/admin` and confirm the outreach status shows `sent` and the sent
   timestamp appears.

No email or SMS is sent automatically in Phase 6. The copied messages are
manual suggestions that should be reviewed before sending.

## Phase 7 Features

- Admin Leads / Deals page at `/admin/leads`
- Manual deal status, priority, notes, conversation summary, deal value, and
  preferred payment method tracking
- Hot lead highlighting for `needs_human`, high-priority, or handoff-required
  leads
- Live contact form leads enter the pipeline as `new` with source
  `website_contact_form`
- Manual launch workflow after a lead is marked `paid_manual`
- Protected future handoff endpoint at `POST /api/handoff`

## Sales Pipeline Testing

1. Open `/admin/leads`.
2. Update a lead status, priority, admin notes, conversation summary, deal
   value, or preferred payment method.
3. Click `Save`, `Mark contacted`, `Mark paid manual`, or `Mark lost`.
4. For a linked lead with status `paid_manual`, click `Launch Website`.
5. Confirm the linked website opens at `/site/[slug]` and the lead status becomes
   `launched`.

To test live contact form lead creation:

1. Set a generated website to live in Supabase:

   ```sql
   update public.websites
   set status = 'live', is_live = true
   where slug = 'your-generated-slug';
   ```

2. Open `/site/[slug]`.
3. Submit the contact form.
4. Open `/admin/leads` and confirm the lead appears with source
   `website_contact_form`, status `new`, and priority `normal`.

To test the protected handoff API:

```bash
curl -X POST http://localhost:3000/api/handoff \
  -H "Content-Type: application/json" \
  -H "x-handoff-secret: $HANDOFF_API_SECRET" \
  -d '{
    "website_slug": "your-generated-slug",
    "name": "Alex Client",
    "email": "alex@example.com",
    "phone": "+1 555 0100",
    "message": "Interested in the preview and pricing.",
    "conversation_summary": "Asked for payment options and launch timing.",
    "priority": "high",
    "preferred_payment_method": "Bank transfer",
    "deal_value_cents": 50000
  }'
```

The API creates a `needs_human` lead with source `bot_handoff`,
`handoff_required = true`, and high priority by default. It requires
`HANDOFF_API_SECRET` and the `x-handoff-secret` header.

## Phase 8 Features

- Admin Outreach Assistant at `/admin/outreach`
- Per-website outreach workspace at `/admin/websites/[id]/outreach`
- Deterministic local message suggestions for initial previews, follow-ups, and
  common objections
- Editable subject/body fields before copying or saving
- Copy buttons for subject, body, and full message
- Manual copy tracking in `outreach_messages`
- Manual sent tracking that updates website outreach status
- Manual inbound reply logging with reply categories
- Hot lead creation/update for interested, price-question, and needs-changes
  replies

## Outreach Assistant Testing

1. Generate and edit a website preview.
2. Open `/admin/outreach`.
3. Click `Outreach` for a website.
4. Review and edit the generated initial preview, follow-up, or objection
   response messages.
5. Click `Copy subject`, `Copy body`, or `Copy full message`.
6. Confirm the message status changes to `copied`.
7. Click `Mark Sent Manually`.
8. Confirm initial previews move website outreach status to `sent`, and
   follow-ups move it to `followed_up`.

To paste a reply and create a hot lead:

1. Open `/admin/websites/[id]/outreach`.
2. Paste the client reply in `Paste Client Reply`.
3. Choose `interested`, `price_question`, or `needs_changes`.
4. Click `Save reply`.
5. Open `/admin/leads` and confirm a high-priority lead appears or the linked
   lead is updated with `handoff_required = true`.

Phase 8 still does not send email/SMS automatically. Messages are manual
suggestions; review them, use accurate sender identity, avoid deceptive subject
lines, include opt-out language for cold email, and follow applicable laws and
platform rules.

## Phase 9 Features

- Admin AI SDR workspace at `/admin/sdr`
- Per-conversation route at `/admin/sdr/[id]`
- Deterministic local intent analysis in mock mode
- Suggested reply generation for manual admin review
- Conversation and message storage in `sdr_conversations` and `sdr_messages`
- Hot lead create/update when intent is `interested`, `price_question`,
  `needs_changes`, or `wants_call`
- Protected future bot endpoint at `POST /api/sdr/message`
- Outreach pages can open or start a linked SDR conversation

## SDR Testing

Use mock mode locally:

```bash
DEV_MOCK_SDR=true
SDR_USE_OPENAI=false
```

Open `/admin/sdr`, paste a client message, and optionally include a website slug
or client contact details. The deterministic analyzer detects:

- `price_question`: price, cost, how much, quote, pricing
- `interested`: interested, looks good, yes, let's do it, sounds good
- `needs_changes`: change, edit, update, modify
- `wants_call`: call, phone, talk, meeting
- `already_has_website`: already have a website, we have a site
- `not_interested`: not interested, no thanks, stop
- `spam`: very short or suspicious messages
- `unclear`: no strong signal

On `/admin/sdr/[id]`, paste another inbound message to re-analyze the
conversation. Use `Copy suggested reply` to copy the draft. The app does not send
messages automatically.

To test the protected SDR API:

```bash
curl -X POST http://localhost:3000/api/sdr/message \
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

Hot intents create or update a lead with `source = ai_sdr_analysis`,
`priority = high`, `handoff_required = true`, and a linked website/business when
available. If the conversation already has a lead, that lead is updated instead
of creating duplicates.

Suggested replies are drafts. Admin must review before sending, avoid
misrepresenting identity, respect opt-out requests, and stop messaging if the
client says they are not interested.

## Phase 10 Features

- Server-side environment validation helpers in `lib/env.ts`
- Production readiness dashboard at `/admin/production`
- Safe health check at `/api/health`
- Centralized API secret verification and sanitized API error helpers
- Hardened `/api/handoff` and `/api/sdr/message` secret handling
- Security headers in `next.config.ts`
- Noindex/nofollow metadata for admin routes
- Deployment guide at [`docs/production-deployment.md`](docs/production-deployment.md)
- `npm run verify` script for typecheck plus build

Phase 10 does not require a Supabase migration.

## Notes

The admin dashboard writes through a server-side Supabase client using the
service role key. Row level security is enabled by the schema so future public
or client-facing features can add explicit policies without exposing admin data.

The generator never stores arbitrary HTML. OpenAI returns structured JSON that
future React preview sections can render safely.
