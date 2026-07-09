alter table public.lead_searches
add column if not exists metadata jsonb;
