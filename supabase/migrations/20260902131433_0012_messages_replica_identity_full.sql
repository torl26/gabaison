-- Supabase Realtime's postgres_changes needs REPLICA IDENTITY FULL to
-- reliably deliver UPDATE events (the default identity only guarantees
-- primary-key columns on the "old" row, which Realtime's change tracking
-- depends on) — without this, read-receipt UPDATEs on messages weren't
-- reaching an already-open chat, only showing up after a reload.
alter table public.messages replica identity full;
