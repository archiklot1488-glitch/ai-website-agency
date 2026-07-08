# AI Website Agency Automation

Phase 1 foundation for an admin-led workflow that stores small business intake
details before future phases add AI-generated website previews, client preview
links, payment unlocks, and live website publishing.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/Postgres

Phase 1 intentionally does not include Stripe, OpenAI integration, lead scraping,
or autonomous outreach.

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

## Notes

The admin dashboard writes through a server-side Supabase client using the
service role key. Row level security is enabled by the schema so future public
or client-facing features can add explicit policies without exposing admin data.
