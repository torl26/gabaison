-- Enable Realtime (postgres_changes) for chat messages.
-- Authorization for the subscription is still gated by the existing
-- messages_select_participant RLS policy.
alter publication supabase_realtime add table public.messages;
