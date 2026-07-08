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

alter table public.leads
add column if not exists linked_website_id uuid references public.websites(id) on delete set null;

alter table public.leads
add column if not exists linked_business_id uuid references public.businesses(id) on delete set null;

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_priority_idx on public.leads(priority);
create index if not exists leads_linked_business_id_idx on public.leads(linked_business_id);
create index if not exists leads_linked_website_id_idx on public.leads(linked_website_id);
