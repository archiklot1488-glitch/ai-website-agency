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

The current phases intentionally do not include Stripe, preview rendering, lead
scraping, autonomous outreach, or custom domains.

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
   OPENAI_MODEL=gpt-4.1-mini
   DEV_MOCK_AI=false
   DEV_MOCK_PLACES=false
   GOOGLE_MAPS_API_KEY=
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

Mock mode does not call Google and does not require `GOOGLE_MAPS_API_KEY`.

## Real Google Places Setup

To use real Google Places searches:

```bash
DEV_MOCK_PLACES=false
GOOGLE_MAPS_API_KEY=your-google-api-key
```

Enable the Places API in Google Cloud for that key. Google calls happen only on
the server through the Lead Finder provider adapter. The app uses Places Text
Search (New) with a minimal field mask and does not scrape Google Maps pages.

## Supabase Migration

For an existing Supabase database, run:

```sql
-- database/migrations/phase4-lead-finder.sql
```

The migration adds nullable source fields to `businesses`, creates
`lead_searches` and `lead_candidates`, and adds indexes without dropping
existing data.

## Notes

The admin dashboard writes through a server-side Supabase client using the
service role key. Row level security is enabled by the schema so future public
or client-facing features can add explicit policies without exposing admin data.

The generator never stores arbitrary HTML. OpenAI returns structured JSON that
future React preview sections can render safely.
