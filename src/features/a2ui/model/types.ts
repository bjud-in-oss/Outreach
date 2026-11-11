import { A2UIPayloadSchema } from '../contracts/a2uiSchema';
import { z } from 'zod';

export type A2UIPayload = z.infer<typeof A2UIPayloadSchema>;
