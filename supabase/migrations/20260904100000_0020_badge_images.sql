-- Badge images: manual (event) badges now carry an uploaded image instead
-- of an emoji icon. match_count badges keep their seeded emoji icon —
-- there is no image asset for those, and they are not admin-editable.
alter table public.badge_definitions
  add column image_url text;

alter table public.badge_definitions
  alter column icon drop not null;

alter table public.badge_definitions
  add constraint badge_definitions_icon_or_image_by_source check (
    (source = 'match_count' and icon is not null and image_url is null)
    or (source = 'manual' and icon is null and image_url is not null)
  );

-- Existing manual badges (created before this migration) have an icon and
-- no image; the new constraint above would reject their existing rows.
-- There are none in this app yet (badges only shipped in the previous
-- migration), but guard the migration itself in case some were created
-- between deploys — clearing icon here is required for the check to hold.
update public.badge_definitions
set icon = null
where source = 'manual' and image_url is null;

-- Public bucket for badge images. Unlike avatars (one object per user,
-- writable by that user), badges have no natural owner at upload time —
-- only admins ever write here, and object names are just random ids.
insert into storage.buckets (id, name, public)
values ('badge-icons', 'badge-icons', true)
on conflict (id) do nothing;

-- Same file type/size rules as avatars (migration 0007), same reasoning:
-- image/svg+xml excluded because it can embed <script> and would be
-- served back verbatim from this public bucket (stored XSS).
update storage.buckets
set
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  file_size_limit = 5242880
where id = 'badge-icons';

create policy "badge_icons_public_read" on storage.objects
  for select
  using (bucket_id = 'badge-icons');

create policy "badge_icons_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'badge-icons' and (select public.is_admin()));

create policy "badge_icons_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'badge-icons' and (select public.is_admin()));

create policy "badge_icons_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'badge-icons' and (select public.is_admin()));
