-- FK columns flagged by the Supabase linter (same convention as migration
-- 0005): badge_definitions.created_by and user_badges.badge_definition_id /
-- awarded_by had no supporting index. user_badges.user_id is already the
-- leading column of its (user_id, badge_definition_id) unique index, so it
-- doesn't need one here.
create index if not exists badge_definitions_created_by_idx on public.badge_definitions (created_by);
create index if not exists user_badges_badge_definition_id_idx on public.user_badges (badge_definition_id);
create index if not exists user_badges_awarded_by_idx on public.user_badges (awarded_by);
