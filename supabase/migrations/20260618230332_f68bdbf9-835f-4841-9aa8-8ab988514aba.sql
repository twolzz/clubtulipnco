create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

grant select, insert on public.subscribers to anon, authenticated;
grant all on public.subscribers to service_role;

alter table public.subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);
