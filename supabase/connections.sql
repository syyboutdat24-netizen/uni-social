-- Connections table for Uni Social
-- Stores connection requests and relationships between students.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users (id) on delete cascade,
  receiver_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sender_id, receiver_id)
);

-- Enable Row Level Security (RLS)
alter table public.connections enable row level security;

-- Allow users to see connections they're involved in
create policy "connections_select_own"
  on public.connections
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Allow users to create connection requests
create policy "connections_insert_own"
  on public.connections
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Allow users to update connections they're involved in
create policy "connections_update_own"
  on public.connections
  for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Keep updated_at in sync automatically when a connection changes.
create trigger set_connections_updated_at
before update on public.connections
for each row
execute procedure public.set_updated_at();