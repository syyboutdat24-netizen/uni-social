-- Posts table for Uni Social
-- Stores posts created by students.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;

-- Allow any authenticated user to see all posts
create policy "posts_select_all_authenticated"
  on public.posts
  for select
  to authenticated
  using (true);

-- Allow users to create their own posts
create policy "posts_insert_own"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own posts
create policy "posts_update_own"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to delete their own posts
create policy "posts_delete_own"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at in sync automatically when a post changes.
create trigger set_posts_updated_at
before update on public.posts
for each row
execute procedure public.set_updated_at();