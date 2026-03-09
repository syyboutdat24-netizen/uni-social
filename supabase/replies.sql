-- Replies table for Uni Social
-- Stores replies to posts by students.

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.replies enable row level security;

-- Allow any authenticated user to see all replies
create policy "replies_select_all_authenticated"
  on public.replies
  for select
  to authenticated
  using (true);

-- Allow users to create their own replies
create policy "replies_insert_own"
  on public.replies
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own replies
create policy "replies_update_own"
  on public.replies
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to delete their own replies
create policy "replies_delete_own"
  on public.replies
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at in sync automatically when a reply changes.
create trigger set_replies_updated_at
before update on public.replies
for each row
execute procedure public.set_updated_at();