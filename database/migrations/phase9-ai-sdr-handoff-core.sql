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

create index if not exists sdr_conversations_business_id_idx
on public.sdr_conversations(business_id);

create index if not exists sdr_conversations_website_id_idx
on public.sdr_conversations(website_id);

create index if not exists sdr_conversations_lead_id_idx
on public.sdr_conversations(lead_id);

create index if not exists sdr_conversations_status_idx
on public.sdr_conversations(status);

create index if not exists sdr_conversations_detected_intent_idx
on public.sdr_conversations(detected_intent);

create index if not exists sdr_conversations_last_message_at_idx
on public.sdr_conversations(last_message_at);

create index if not exists sdr_messages_conversation_id_idx
on public.sdr_messages(conversation_id);

create index if not exists sdr_messages_created_at_idx
on public.sdr_messages(created_at);

drop trigger if exists sdr_conversations_set_updated_at on public.sdr_conversations;
create trigger sdr_conversations_set_updated_at
before update on public.sdr_conversations
for each row
execute function public.set_updated_at();

alter table public.sdr_conversations enable row level security;
alter table public.sdr_messages enable row level security;
