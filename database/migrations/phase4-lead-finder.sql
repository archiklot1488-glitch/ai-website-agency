create extension if not exists pgcrypto;

alter table public.businesses add column if not exists source text;
alter table public.businesses add column if not exists source_place_id text;
alter table public.businesses add column if not exists google_maps_url text;
alter table public.businesses add column if not exists rating numeric;
alter table public.businesses add column if not exists review_count integer;
alter table public.businesses add column if not exists lead_score integer;
alter table public.businesses add column if not exists qualification text;

create table if not exists public.lead_searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  niche text not null,
  city text not null,
  country text,
  provider text not null default 'mock',
  status text not null default 'completed',
  result_count integer default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.lead_candidates (
  id uuid primary key default gen_random_uuid(),
  lead_search_id uuid references public.lead_searches(id) on delete cascade,
  provider text not null,
  provider_place_id text,
  business_name text not null,
  category text,
  address text,
  city text,
  country text,
  phone text,
  website_url text,
  google_maps_url text,
  rating numeric,
  review_count integer,
  business_status text,
  has_website boolean default false,
  lead_score integer not null default 0,
  qualification text,
  raw_data jsonb,
  imported_business_id uuid references public.businesses(id),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists businesses_source_place_id_idx on public.businesses(source_place_id);
create index if not exists lead_candidates_provider_place_id_idx on public.lead_candidates(provider_place_id);
create index if not exists lead_candidates_lead_search_id_idx on public.lead_candidates(lead_search_id);
create index if not exists lead_candidates_lead_score_idx on public.lead_candidates(lead_score);
create index if not exists lead_candidates_imported_business_id_idx on public.lead_candidates(imported_business_id);

alter table public.lead_searches enable row level security;
alter table public.lead_candidates enable row level security;
