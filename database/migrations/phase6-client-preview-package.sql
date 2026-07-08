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

create index if not exists websites_outreach_status_idx
on public.websites(outreach_status);
