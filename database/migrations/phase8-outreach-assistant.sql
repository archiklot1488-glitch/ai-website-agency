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

create index if not exists outreach_messages_business_id_idx
on public.outreach_messages(business_id);

create index if not exists outreach_messages_website_id_idx
on public.outreach_messages(website_id);

create index if not exists outreach_messages_lead_id_idx
on public.outreach_messages(lead_id);

create index if not exists outreach_messages_status_idx
on public.outreach_messages(status);

create index if not exists outreach_messages_message_type_idx
on public.outreach_messages(message_type);

create index if not exists outreach_messages_created_at_idx
on public.outreach_messages(created_at);

drop trigger if exists outreach_messages_set_updated_at on public.outreach_messages;
create trigger outreach_messages_set_updated_at
before update on public.outreach_messages
for each row
execute function public.set_updated_at();

alter table public.outreach_messages enable row level security;
