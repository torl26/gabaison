import type { MatchRequestStatus } from '@/types/database';

export const STATUS_LABELS: Record<MatchRequestStatus, string> = {
  pending: '審査中',
  accepted: '承認済み',
  rejected: '却下',
};
