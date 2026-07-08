create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text,
  city text,
  country text,
  phone text,
  email text,
  website_url text,
  services text,
  description text,
  preferred_style text,
  main_cta text,
  source text,
  source_place_id text,
  google_maps_url text,
  rating numeric,
  review_count integer,
  lead_score integer,
  qualification text,
  status text not null default 'draft',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.businesses add column if not exists source text;
alter table public.businesses add column if not exists source_place_id text;
alter table public.businesses add column if not exists google_maps_url text;
alter table public.businesses add column if not exists rating numeric;
alter table public.businesses add column if not exists review_count integer;
alter table public.businesses add column if not exists lead_score integer;
alter table public.businesses add column if not exists qualification text;

create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  slug text unique not null,
  preview_token text unique not null,
  website_json jsonb,
  status text not null default 'draft',
  is_live boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  website_id uuid references public.websites(id) on delete set null,
  name text,
  phone text,
  email text,
  message text,
  source text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  website_id uuid references public.websites(id) on delete set null,
  stripe_session_id text,
  amount integer,
  currency text not null default 'usd',
  status text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

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

create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_source_place_id_idx on public.businesses(source_place_id);
create index if not exists websites_business_id_idx on public.websites(business_id);
create index if not exists websites_status_idx on public.websites(status);
create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_website_id_idx on public.leads(website_id);
create index if not exists payments_business_id_idx on public.payments(business_id);
create index if not exists payments_website_id_idx on public.payments(website_id);
create index if not exists lead_candidates_provider_place_id_idx on public.lead_candidates(provider_place_id);
create index if not exists lead_candidates_lead_search_id_idx on public.lead_candidates(lead_search_id);
create index if not exists lead_candidates_lead_score_idx on public.lead_candidates(lead_score);
create index if not exists lead_candidates_imported_business_id_idx on public.lead_candidates(imported_business_id);

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

drop trigger if exists websites_set_updated_at on public.websites;
create trigger websites_set_updated_at
before update on public.websites
for each row
execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.websites enable row level security;
alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.lead_searches enable row level security;
alter table public.lead_candidates enable row level security;
