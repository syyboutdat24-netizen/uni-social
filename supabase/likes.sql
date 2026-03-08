-- Likes table for Uni Social
-- Stores likes on posts by students.

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);

-- Enable Row Level Security (RLS)
alter table public.likes enable row level security;

-- Allow any authenticated user to see all likes
create policy "likes_select_all_authenticated"
  on public.likes
  for select
  to authenticated
  using (true);

-- Allow users to create their own likes
create policy "likes_insert_own"
  on public.likes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to delete their own likes
create policy "likes_delete_own"
  on public.likes
  for delete
  to authenticated
  using (auth.uid() = user_id);