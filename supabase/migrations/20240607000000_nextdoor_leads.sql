create type lead_status as enum ('new', 'contacted', 'dismissed');

create table nextdoor_leads (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users not null,
  poster_id         text not null,
  post_id           text not null,
  poster_name       text,
  post_snippet      text,
  neighborhood      text,
  status            lead_status not null default 'new',
  first_seen_at     timestamp with time zone default timezone('utc', now()) not null,
  status_updated_at timestamp with time zone default timezone('utc', now()) not null,
  expires_at        timestamp with time zone
                      generated always as (first_seen_at + interval '30 days') stored
);

-- Dedup constraint — ON CONFLICT (user_id, poster_id, post_id) DO NOTHING
-- makes ingest idempotent and prevents dismissed/contacted leads from
-- reappearing as new when the agent re-scans old posts.
alter table nextdoor_leads
  add constraint nextdoor_leads_dedup unique (user_id, poster_id, post_id);

create index idx_nextdoor_leads_user_status
  on nextdoor_leads (user_id, status, expires_at);

alter table nextdoor_leads enable row level security;

create policy "Users can view their own leads."
  on nextdoor_leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their own leads."
  on nextdoor_leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads."
  on nextdoor_leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own leads."
  on nextdoor_leads for delete
  using (auth.uid() = user_id);

-- One row per user — tracks where the agent left off scanning.
create table nextdoor_watermarks (
  user_id         uuid references auth.users not null primary key,
  last_post_id    text,
  last_scanned_at timestamp with time zone default timezone('utc', now()) not null
);

alter table nextdoor_watermarks enable row level security;

create policy "Users can view their own watermark."
  on nextdoor_watermarks for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own watermark."
  on nextdoor_watermarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watermark."
  on nextdoor_watermarks for update
  using (auth.uid() = user_id);

-- Hard-delete expired rows (call via pg_cron or manually).
-- Application layer also filters by expires_at > now() so this is optional.
create or replace function expire_old_leads()
returns void
language plpgsql
security definer
as $$
begin
  delete from nextdoor_leads
  where expires_at < timezone('utc', now());
end;
$$;
