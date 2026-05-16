create table if not exists public.leads (
  id bigint generated always as identity primary key,
  name text not null,
  age text not null,
  city text,
  time text,
  phone text not null,
  attendance text,
  guardian_authorization text,
  model_evaluation_experience text,
  registration_step integer not null default 1,
  registration_status text not null default 'started',
  consent boolean not null default false,
  source text not null default 'facebook-landing-page',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  completed_at timestamptz,
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

create table if not exists public.event_cities (
  id bigint generated always as identity primary key,
  label text not null,
  venue_name text,
  address text,
  event_date date,
  whatsapp_number_id bigint,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists event_cities_label_event_date_key
on public.event_cities (label, event_date);

create table if not exists public.event_whatsapp_numbers (
  id bigint generated always as identity primary key,
  label text not null,
  phone text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists event_whatsapp_numbers_phone_key
on public.event_whatsapp_numbers (phone);

alter table public.event_cities
drop constraint if exists event_cities_whatsapp_number_id_fkey;

alter table public.event_cities
add constraint event_cities_whatsapp_number_id_fkey
foreign key (whatsapp_number_id) references public.event_whatsapp_numbers (id) on delete set null;

create table if not exists public.event_times (
  id bigint generated always as identity primary key,
  label text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_city_times (
  id bigint generated always as identity primary key,
  city_id bigint not null references public.event_cities (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, label)
);

alter table public.leads enable row level security;
alter table public.event_cities enable row level security;
alter table public.event_times enable row level security;
alter table public.event_city_times enable row level security;
alter table public.event_whatsapp_numbers enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.leads to anon, authenticated;
grant select, insert, update, delete on table public.event_cities to anon, authenticated;
grant select, insert, update, delete on table public.event_times to anon, authenticated;
grant select, insert, update, delete on table public.event_city_times to anon, authenticated;
grant select, insert, update, delete on table public.event_whatsapp_numbers to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop policy if exists "Allow public inserts on leads" on public.leads;
create policy "Allow public inserts on leads"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public reads on leads" on public.leads;
create policy "Allow public reads on leads"
on public.leads
for select
to anon, authenticated
using (true);

drop policy if exists "Allow public updates on leads" on public.leads;
create policy "Allow public updates on leads"
on public.leads
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public manage event cities" on public.event_cities;
create policy "Allow public manage event cities"
on public.event_cities
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public manage event times" on public.event_times;
create policy "Allow public manage event times"
on public.event_times
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public manage city times" on public.event_city_times;
create policy "Allow public manage city times"
on public.event_city_times
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public manage whatsapp numbers" on public.event_whatsapp_numbers;
create policy "Allow public manage whatsapp numbers"
on public.event_whatsapp_numbers
for all
to anon, authenticated
using (true)
with check (true);
