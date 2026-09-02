import { z } from 'zod';

export const cancelRequestSchema = z.object({
  requestId: z.string().uuid(),
});