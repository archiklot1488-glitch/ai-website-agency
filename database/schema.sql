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
  offer_price_cents integer,
  offer_currency text not null default 'USD',
  offer_notes text,
  preview_sent_at timestamp with time zone,
  client_message text,
  follow_up_message text,
  outreach_status text not null default 'not_sent',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.websites add column if not exists offer_price_cents integer;
alter table public.websites add column if not exists offer_currency text;
alter table public.websites alter column offer_currency set default 'USD';
update public.websites set offer_currency = 'USD' where offer_currency is null;
alter table public.websites alter column offer_currency set not null;
alter table public.websites add column if not exists offer_notes text;
alter table public.websites add column if not exists preview_sent_at timestamp with time zone;
alter table public.websites add column if not exists client_message text;
alter table public.websites add column if not exists follow_up_message text;
alter table public.websites add column if not exists outreach_status text;
alter table public.websites alter column outreach_status set default 'not_sent';
update public.websites set outreach_status = 'not_sent' where outreach_status is null;
alter table public.websites alter column outreach_status set not null;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  website_id uuid references public.websites(id) on delete set null,
  name text,
  phone text,
  email text,
  message text,
  source text,
  status text not null default 'new',
  priority text not null default 'normal',
  conversation_summary text,
  last_contacted_at timestamp with time zone,
  admin_notes text,
  deal_value_cents integer,
  deal_currency text not null default 'USD',
  preferred_payment_method text,
  handoff_required boolean not null default false,
  linked_website_id uuid references public.websites(id) on delete set null,
  linked_business_id uuid references public.businesses(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.leads add column if not exists status text;
alter table public.leads alter column status set default 'new';
update public.leads set status = 'new' where status is null;
alter table public.leads alter column status set not null;
alter table public.leads add column if not exists priority text;
alter table public.leads alter column priority set default 'normal';
update public.leads set priority = 'normal' where priority is null;
alter table public.leads alter column priority set not null;
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists conversation_summary text;
alter table public.leads add column if not exists last_contacted_at timestamp with time zone;
alter table public.leads add column if not exists admin_notes text;
alter table public.leads add column if not exists deal_value_cents integer;
alter table public.leads add column if not exists deal_currency text;
alter table public.leads alter column deal_currency set default 'USD';
update public.leads set deal_currency = 'USD' where deal_currency is null;
alter table public.leads alter column deal_currency set not null;
alter table public.leads add column if not exists preferred_payment_method text;
alter table public.leads add column if not exists handoff_required boolean;
alter table public.leads alter column handoff_required set default false;
update public.leads set handoff_required = false where handoff_required is null;
alter table public.leads alter column handoff_required set not null;
alter table public.leads add column if not exists linked_website_id uuid references public.websites(id) on delete set null;
alter table public.leads add column if not exists linked_business_id uuid references public.businesses(id) on delete set null;

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
  metadata jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.lead_searches add column if not exists metadata jsonb;

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

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  website_id uuid references public.websites(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  message_type text not null,
  channel text not null default 'manual',
  direction text not null default 'outbound',
  subject text,
  body text not null,
  status text not null default 'draft',
  copied_at timestamp with time zone,
  sent_manual_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.sdr_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  website_id uuid references public.websites(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  outreach_message_id uuid references public.outreach_messages(id) on delete set null,
  channel text not null default 'manual',
  status text not null default 'open',
  client_name text,
  client_email text,
  client_phone text,
  conversation_summary text,
  detected_intent text,
  handoff_required boolean not null default false,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.sdr_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sdr_conversations(id) on delete cascade,
  direction text not null,
  sender_role text not null default 'client',
  body text not null,
  detected_intent text,
  suggested_reply text,
  analysis jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_source_place_id_idx on public.businesses(source_place_id);
create index if not exists websites_business_id_idx on public.websites(business_id);
create index if not exists websites_status_idx on public.websites(status);
create index if not exists websites_outreach_status_idx on public.websites(outreach_status);
create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_website_id_idx on public.leads(website_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_priority_idx on public.leads(priority);
create index if not exists leads_linked_business_id_idx on public.leads(linked_business_id);
create index if not exists leads_linked_website_id_idx on public.leads(linked_website_id);
create index if not exists payments_business_id_idx on public.payments(business_id);
create index if not exists payments_website_id_idx on public.payments(website_id);
create index if not exists lead_candidates_provider_place_id_idx on public.lead_candidates(provider_place_id);
create index if not exists lead_candidates_lead_search_id_idx on public.lead_candidates(lead_search_id);
create index if not exists lead_candidates_lead_score_idx on public.lead_candidates(lead_score);
create index if not exists lead_candidates_imported_business_id_idx on public.lead_candidates(imported_business_id);
create index if not exists outreach_messages_business_id_idx on public.outreach_messages(business_id);
create index if not exists outreach_messages_website_id_idx on public.outreach_messages(website_id);
create index if not exists outreach_messages_lead_id_idx on public.outreach_messages(lead_id);
create index if not exists outreach_messages_status_idx on public.outreach_messages(status);
create index if not exists outreach_messages_message_type_idx on public.outreach_messages(message_type);
create index if not exists outreach_messages_created_at_idx on public.outreach_messages(created_at);
create index if not exists sdr_conversations_business_id_idx on public.sdr_conversations(business_id);
create index if not exists sdr_conversations_website_id_idx on public.sdr_conversations(website_id);
create index if not exists sdr_conversations_lead_id_idx on public.sdr_conversations(lead_id);
create index if not exists sdr_conversations_status_idx on public.sdr_conversations(status);
create index if not exists sdr_conversations_detected_intent_idx on public.sdr_conversations(detected_intent);
create index if not exists sdr_conversations_last_message_at_idx on public.sdr_conversations(last_message_at);
create index if not exists sdr_messages_conversation_id_idx on public.sdr_messages(conversation_id);
create index if not exists sdr_messages_created_at_idx on public.sdr_messages(created_at);

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

drop trigger if exists outreach_messages_set_updated_at on public.outreach_messages;
create trigger outreach_messages_set_updated_at
before update on public.outreach_messages
for each row
execute function public.set_updated_at();

drop trigger if exists sdr_conversations_set_updated_at on public.sdr_conversations;
create trigger sdr_conversations_set_updated_at
before update on public.sdr_conversations
for each row
execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.websites enable row level security;
alter table public.leads enable row level security;
alter table public.payments enable row level security;
alter table public.lead_searches enable row level security;
alter table public.lead_candidates enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.sdr_conversations enable row level security;
alter table public.sdr_messages enable row level security;
