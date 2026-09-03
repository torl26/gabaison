import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(import.meta.dirname, '20260830034651_0003_enable_messages_realtime.sql'),
  'utf-8'
).toLowerCase();

describe('20260830034651_0003_enable_messages_realtime.sql', () => {
  it('adds messages to the supabase_realtime publication', () => {
    expect(sql).toContain('alter publication supabase_realtime add table public.messages');
  });
});
