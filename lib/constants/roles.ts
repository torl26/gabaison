import type { ProfileRole } from '@/types/database';

export const ROLE_LABELS: Record<ProfileRole, string> = {
  student: '学生',
  mentor: 'メンター',
  admin: '管理者',
};
