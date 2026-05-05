alter table public.leads
add column if not exists age text;

alter table public.leads
add column if not exists city text;

alter table public.leads
add column if not exists time text;

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

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'gender'
  ) then
    execute 'alter table public.leads alter column gender drop not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'birth_date'
  ) then
    execute 'alter table public.leads alter column birth_date drop not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'email'
  ) then
    execute 'alter table public.leads alter column email drop not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'state'
  ) then
    execute 'alter table public.leads alter column state drop not null';
  end if;
end
$$;

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

alter table public.event_cities
add column if not exists venue_name text;

alter table public.event_cities
add column if not exists address text;

alter table public.event_cities
add column if not exists event_date date;

alter table public.event_cities
add column if not exists whatsapp_number_id bigint;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'event_cities_label_key'
      and conrelid = 'public.event_cities'::regclass
  ) then
    execute 'alter table public.event_cities drop constraint event_cities_label_key';
  end if;
end
$$;

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

drop policy if exists "Allow anon inserts on leads" on public.leads;
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

insert into public.event_whatsapp_numbers (label, phone, sort_order, active)
values
  ('Santos', '5511919792976', 1, true),
  ('Campinas', '5511925517859', 2, true)
on conflict (phone) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = excluded.active;

update public.event_cities c
set whatsapp_number_id = numbers.id
from public.event_whatsapp_numbers numbers
where c.whatsapp_number_id is null
  and (
    (lower(c.label) like '%santos%' and lower(numbers.label) = 'santos')
    or
    (lower(c.label) like '%campinas%' and lower(numbers.label) = 'campinas')
  );

update public.event_cities
set event_date = to_date(
    substring(label from '(\d{2}/\d{2})$') || '/' || extract(year from current_date)::text,
    'DD/MM/YYYY'
  )
where event_date is null
  and label ~ '\d{2}/\d{2}';

update public.event_cities
set label = trim(regexp_replace(label, '\s*\d{2}/\d{2}\s*$', '', 'g'))
where label ~ '\d{2}/\d{2}';

insert into public.event_cities (label, event_date, sort_order)
values
  ('Campinas', '2026-04-10', 1),
  ('São Paulo', '2026-04-12', 2),
  ('Sorocaba', '2026-04-14', 3)
on conflict (label, event_date) do nothing;

update public.event_cities
set venue_name = case
    when label = 'Campinas' and event_date = '2026-04-10' then coalesce(nullif(venue_name, ''), 'Hotel Leon Park')
    when label = 'São Paulo' and event_date = '2026-04-12' then coalesce(nullif(venue_name, ''), 'Local a confirmar')
    when label = 'Sorocaba' and event_date = '2026-04-14' then coalesce(nullif(venue_name, ''), 'Local a confirmar')
    else venue_name
  end,
  address = case
    when label = 'Campinas' and event_date = '2026-04-10' then coalesce(nullif(address, ''), 'Av. Francisco Glicério, 641')
    when label = 'São Paulo' and event_date = '2026-04-12' then coalesce(nullif(address, ''), 'Endereço a confirmar')
    when label = 'Sorocaba' and event_date = '2026-04-14' then coalesce(nullif(address, ''), 'Endereço a confirmar')
    else address
  end;

insert into public.event_times (label, sort_order)
values
  ('10h', 1),
  ('12h', 2),
  ('15h30', 3),
  ('17h30', 4),
  ('19h30', 5)
on conflict (label) do nothing;

insert into public.event_city_times (city_id, label, sort_order, active)
select
  c.id,
  t.label,
  t.sort_order,
  t.active
from public.event_cities c
cross join public.event_times t
on conflict (city_id, label) do nothing;
