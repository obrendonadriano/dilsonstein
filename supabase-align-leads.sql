alter table public.leads
add column if not exists age text;

alter table public.leads
add column if not exists city text;

alter table public.leads
add column if not exists phone text;

alter table public.leads
add column if not exists consent boolean not null default false;

alter table public.leads
add column if not exists source text not null default 'facebook-landing-page';

alter table public.leads
add column if not exists created_at timestamptz not null default now();

alter table public.leads
add column if not exists page_url text;

alter table public.leads
add column if not exists utm_source text;

alter table public.leads
add column if not exists utm_medium text;

alter table public.leads
add column if not exists utm_campaign text;

alter table public.leads
add column if not exists utm_content text;

alter table public.leads
add column if not exists utm_term text;

alter table public.leads
add column if not exists fbclid text;

alter table public.leads
add column if not exists fbc text;

alter table public.leads
add column if not exists fbp text;

alter table public.leads
add column if not exists user_agent text;

alter table public.leads
add column if not exists locale text;

alter table public.leads
alter column gender drop not null,
alter column birth_date drop not null,
alter column email drop not null,
alter column state drop not null;

alter table public.leads enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;

drop policy if exists "Allow anon inserts on leads" on public.leads;
drop policy if exists "Allow public inserts on leads" on public.leads;

create policy "Allow public inserts on leads"
on public.leads
for insert
to anon, authenticated
with check (true);
