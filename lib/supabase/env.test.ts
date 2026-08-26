import { afterEach, describe, expect, it } from 'vitest';
import { getSupabaseEnv } from './env';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getSupabaseEnv', () => {
  it('returns url and anonKey when both env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(getSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    });
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set');
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getSupabaseEnv()).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  });
});
