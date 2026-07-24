-- Per-member, per-timeline "last visited" timestamps powering the
-- "N new photos since you last visited" badge on timeline cards.

create table timeline_views (
  timeline_id uuid references timelines on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  last_viewed_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (timeline_id, user_id)
);
alter table timeline_views enable row level security;

create policy "Users manage their own view timestamps." on timeline_views
  for select using (user_id = auth.uid());
create policy "Users record their own views." on timeline_views
  for insert with check (
    user_id = auth.uid() and is_timeline_member(timeline_id, auth.uid())
  );
create policy "Users update their own view timestamps." on timeline_views
  for update using (user_id = auth.uid());
