create table if not exists public.leads (
  id bigint generated always as identity primary key,
  name text not null,
  age text not null,
  city text not null,
  phone text not null,
  consent boolean not null default false,
  source text not null default 'facebook-landing-page',
  created_at timestamptz not null default now(),
  page_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  fbclid text,
  fbc text,
  fbp text,
  user_agent text,
  locale text
);

alter table public.leads enable row level security;

create policy "Allow anon inserts on leads"
on public.leads
for insert
to anon
with check (true);
