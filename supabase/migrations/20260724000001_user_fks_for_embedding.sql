-- Point user-referencing FKs at public.users (instead of auth.users) so
-- PostgREST can embed profile data (full_name, avatar_url) when querying
-- family_members and photos. Every auth user has a public.users row via
-- the handle_new_user trigger, so this is a pure re-target.

alter table family_members
  drop constraint family_members_user_id_fkey,
  add constraint family_members_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade;

alter table photos
  drop constraint photos_uploader_id_fkey,
  add constraint photos_uploader_id_fkey
    foreign key (uploader_id) references public.users (id);

alter table photo_likes
  drop constraint photo_likes_user_id_fkey,
  add constraint photo_likes_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade;
