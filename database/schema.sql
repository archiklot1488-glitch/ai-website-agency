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
  status text not null default 'draft',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

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

create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists websites_business_id_idx on public.websites(business_id);
create index if not exists websites_status_idx on public.websites(status);
create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_website_id_idx on public.leads(website_id);
create index if not exists payments_business_id_idx on public.payments(business_id);
create index if not exists payments_website_id_idx on public.payments(website_id);

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
