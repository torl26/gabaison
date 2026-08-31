import { z } from 'zod';

export const respondToRequestSchema = z.object({
  requestId: z.string().uuid('申請IDが不正です'),
  decision: z.enum(['accepted', 'rejected'], {
    message: '承認・却下のいずれかを選択してください',
  }),
});

export type RespondToRequestInput = z.infer<typeof respondToRequestSchema>;
