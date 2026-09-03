import type { createClient } from '@/lib/supabase/server';
import type { BadgeSource } from '@/types/database';

export interface BadgeDefinitionRow {
  id: string;
  label: string;
  icon: string;
  source: BadgeSource;
}

export async function fetchManualBadgeDefinitions(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BadgeDefinitionRow[]> {
  const { data } = await supabase
    .from('badge_definitions')
    .select('id, label, icon, source')
    .eq('source', 'manual')
    .order('created_at', { ascending: false });

  return (data ?? []) as unknown as BadgeDefinitionRow[];
}
