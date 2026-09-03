import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '0011_message_read_receipts.sql'),
  'utf-8'
).toLowerCase();

describe('0011_message_read_receipts.sql', () => {
  it('adds a nullable read_at column to messages', () => {
    expect(sql).toContain('alter table public.messages add column read_at timestamptz');
  });

  it('lets only the non-sender participant mark a message read', () => {
    expect(sql).toContain('create policy "messages_update_mark_read" on public.messages');
    expect(sql).toContain("sender_id <> (select auth.uid())");
  });

  it('restricts updates to only the read_at column via trigger', () => {
    expect(sql).toContain('create or replace function public.enforce_message_read_only_update()');
    expect(sql).toContain('new.content is distinct from old.content');
    expect(sql).toContain('new.sender_id is distinct from old.sender_id');
    expect(sql).toContain('create trigger messages_enforce_read_only_update');
  });

  it('revokes public execute on the trigger-only function', () => {
    expect(sql).toContain(
      'revoke execute on function public.enforce_message_read_only_update() from public, anon, authenticated'
    );
  });
});
