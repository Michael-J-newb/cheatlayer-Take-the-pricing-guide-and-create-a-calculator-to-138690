/**
* USERS
* Profile row per auth user. Users update their own row; fellow family
* members can read it (needed to render uploader names/avatars on photos).
*/
create table users (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text
);
alter table users enable row level security;

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* FAMILIES
*/
create type family_role as enum ('owner', 'member');
create type capture_time_source as enum ('exif', 'upload_fallback');

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
alter table families enable row level security;

create table family_members (
  family_id uuid references families on delete cascade not null,
  -- references public.users (not auth.users) so PostgREST can embed profiles
  user_id uuid references public.users on delete cascade not null,
  role family_role not null default 'member',
  joined_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (family_id, user_id)
);
alter table family_members enable row level security;
create index family_members_user_id_idx on family_members (user_id);

create table family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families on delete cascade not null,
  code text not null unique,
  created_by uuid references auth.users not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);
alter table family_invites enable row level security;

/**
* TIMELINES — one per trip/event; photos hang off a timeline, not the family.
*/
create table timelines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families on delete cascade not null,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  -- FK added after photos exists (circular reference)
  cover_photo_id uuid
);
alter table timelines enable row level security;
create index timelines_family_id_idx on timelines (family_id);

/**
* PHOTOS
* gps_lat/gps_lng are raw EXIF, stored for future map features but never
* rendered directly — only location_town (city-level) is shown in the UI.
*/
create table photos (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid references timelines on delete cascade not null,
  -- references public.users (not auth.users) so PostgREST can embed profiles
  uploader_id uuid references public.users not null,
  storage_path text not null,
  -- Server-generated JPEG preview for HEIC originals (nullable otherwise)
  preview_storage_path text,
  original_filename text not null,
  mime_type text not null,
  width integer,
  height integer,
  captured_at timestamp with time zone,
  captured_at_source capture_time_source not null default 'upload_fallback',
  gps_lat double precision,
  gps_lng double precision,
  location_town text,
  uploaded_at timestamp with time zone not null default timezone('utc'::text, now()),
  checksum_sha256 text
);
alter table photos enable row level security;
create index photos_timeline_sort_idx on photos (timeline_id, captured_at, uploaded_at);
create index photos_timeline_checksum_idx on photos (timeline_id, checksum_sha256);

alter table timelines
  add constraint timelines_cover_photo_id_fkey
  foreign key (cover_photo_id) references photos (id) on delete set null;

create table photo_likes (
  photo_id uuid references photos on delete cascade not null,
  user_id uuid references public.users on delete cascade not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (photo_id, user_id)
);
alter table photo_likes enable row level security;
create index photo_likes_user_id_idx on photo_likes (user_id);

/**
* GEOCODE CACHE — server-only (service role); no client policies.
* Keyed on coordinates rounded to 2 decimals so repeat lookups near the
* same spot never re-hit Nominatim.
*/
create table geocode_cache (
  rounded_lat numeric(8, 2) not null,
  rounded_lng numeric(8, 2) not null,
  location_town text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (rounded_lat, rounded_lng)
);
alter table geocode_cache enable row level security;

/**
* SECURITY DEFINER HELPERS
* Membership checks used inside RLS policies. These must be security
* definer: a policy on family_members that queries family_members again
* recurses infinitely under RLS. Do NOT "fix" a recursion error by
* weakening a policy — route it through these helpers instead.
*/
create or replace function public.is_family_member(_family_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where family_id = _family_id and user_id = _user_id
  );
$$;

create or replace function public.is_family_owner(_family_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from family_members
    where family_id = _family_id and user_id = _user_id and role = 'owner'
  );
$$;

create or replace function public.is_family_creator(_family_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from families
    where id = _family_id and created_by = _user_id
  );
$$;

create or replace function public.is_timeline_member(_timeline_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from timelines t
    join family_members fm on fm.family_id = t.family_id
    where t.id = _timeline_id and fm.user_id = _user_id
  );
$$;

create or replace function public.is_photo_family_member(_photo_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from photos p
    join timelines t on t.id = p.timeline_id
    join family_members fm on fm.family_id = t.family_id
    where p.id = _photo_id and fm.user_id = _user_id
  );
$$;

create or replace function public.shares_family_with(_other_user_id uuid, _user_id uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select _other_user_id = _user_id or exists (
    select 1
    from family_members a
    join family_members b on a.family_id = b.family_id
    where a.user_id = _other_user_id and b.user_id = _user_id
  );
$$;

/**
* JOIN VIA INVITE CODE
* Validates the (reusable-until-expiry) code and inserts the membership in
* one step, so no select policy on family_invites is needed for joiners.
*/
create or replace function public.join_family_with_code(_code text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  _invite family_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select * into _invite
  from family_invites
  where code = _code and expires_at > now()
  limit 1;
  if not found then
    raise exception 'Invalid or expired invite code';
  end if;
  insert into family_members (family_id, user_id, role)
  values (_invite.family_id, auth.uid(), 'member')
  on conflict (family_id, user_id) do nothing;
  return _invite.family_id;
end;
$$;

/**
* RLS POLICIES
*/
-- users
create policy "Can view own user data." on users
  for select using (auth.uid() = id);
create policy "Can view fellow family members." on users
  for select using (shares_family_with(id, auth.uid()));
create policy "Can update own user data." on users
  for update using (auth.uid() = id);

-- families
create policy "Members can view their families." on families
  for select using (is_family_member(id, auth.uid()));
create policy "Anyone can create a family they own." on families
  for insert with check (auth.uid() = created_by);
create policy "Owners can update their family." on families
  for update using (is_family_owner(id, auth.uid()));
create policy "Owners can delete their family." on families
  for delete using (is_family_owner(id, auth.uid()));

-- family_members
create policy "Members can view the family roster." on family_members
  for select using (is_family_member(family_id, auth.uid()));
create policy "Family creator bootstraps their own membership." on family_members
  for insert with check (
    user_id = auth.uid() and is_family_creator(family_id, auth.uid())
  );
create policy "Owners can remove members; members can leave." on family_members
  for delete using (
    is_family_owner(family_id, auth.uid()) or user_id = auth.uid()
  );

-- family_invites (joiners never read this table directly — see join_family_with_code)
create policy "Owners can view invite codes." on family_invites
  for select using (is_family_owner(family_id, auth.uid()));
create policy "Owners can create invite codes." on family_invites
  for insert with check (
    created_by = auth.uid() and is_family_owner(family_id, auth.uid())
  );
create policy "Owners can revoke invite codes." on family_invites
  for delete using (is_family_owner(family_id, auth.uid()));

-- timelines
create policy "Members can view timelines." on timelines
  for select using (is_family_member(family_id, auth.uid()));
create policy "Members can create timelines." on timelines
  for insert with check (
    created_by = auth.uid() and is_family_member(family_id, auth.uid())
  );
create policy "Owners can update timelines." on timelines
  for update using (is_family_owner(family_id, auth.uid()));
create policy "Owners can delete timelines." on timelines
  for delete using (is_family_owner(family_id, auth.uid()));

-- photos
create policy "Members can view photos." on photos
  for select using (is_timeline_member(timeline_id, auth.uid()));
create policy "Members upload their own photos." on photos
  for insert with check (
    uploader_id = auth.uid() and is_timeline_member(timeline_id, auth.uid())
  );
create policy "Uploaders can delete their own photos." on photos
  for delete using (uploader_id = auth.uid());

-- photo_likes
create policy "Members can view likes." on photo_likes
  for select using (is_photo_family_member(photo_id, auth.uid()));
create policy "Members can like photos." on photo_likes
  for insert with check (
    user_id = auth.uid() and is_photo_family_member(photo_id, auth.uid())
  );
create policy "Users can unlike their own likes." on photo_likes
  for delete using (user_id = auth.uid());

/**
* STORAGE
* Private bucket; object paths follow family_id/timeline_id/<uuid>-<name>.
* Signed URLs are minted server-side; these policies additionally allow
* direct authenticated access scoped by family membership.
*/
insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', false);

create policy "Members can read family photos." on storage.objects
  for select using (
    bucket_id = 'family-photos'
    and is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );
create policy "Members can upload family photos." on storage.objects
  for insert with check (
    bucket_id = 'family-photos'
    and is_family_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

/**
* REALTIME — nothing published in MVP.
*/
drop publication if exists supabase_realtime;
