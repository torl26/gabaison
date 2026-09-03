import { z } from 'zod';
import { REPORT_REASON_KEYS } from '@/lib/constants/report-reasons';

export const reportUserSchema = z.object({
  reportedId: z.uuid(),
  reason: z.enum(REPORT_REASON_KEYS, { message: '通報理由を選択してください' }),
});
