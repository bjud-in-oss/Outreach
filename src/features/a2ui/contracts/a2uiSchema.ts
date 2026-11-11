import { z } from 'zod';

export const A2UIPayloadSchema = z.object({
  componentId: z.string(),
  dataModel: z.record(z.any()),
});

export type A2UIPayload = z.infer<typeof A2UIPayloadSchema>;
