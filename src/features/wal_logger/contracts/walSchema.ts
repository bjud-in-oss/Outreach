import { z } from 'zod';
import { EventEnvelopeSchema } from '../../../shared/contracts/envelope.ts';

export const WalStatusSchema = z.enum(['PENDING', 'COMMITTED', 'FAILED', 'ROLLED_BACK']);
export type WalStatus = z.infer<typeof WalStatusSchema>;

export const WalEntrySchema = z.object({
  sequenceNumber: z.number().int().positive(),
  entryHash: z.string().min(1),
  previousHash: z.string(),
  timestamp: z.string(),
  status: WalStatusSchema,
  envelope: EventEnvelopeSchema,
  errorMessage: z.string().optional(),
});

export type WalEntry = z.infer<typeof WalEntrySchema>;

export const TransientDiagnosticEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  data: z.record(z.string(), z.any()),
  pcmAudioRef: z.object({
    durationMs: z.number().default(3000),
    sampleRate: z.number().default(16000),
    hasAudio: z.boolean(),
    byteLength: z.number().optional(),
  }).optional(),
});

export type TransientDiagnosticEntryType = z.infer<typeof TransientDiagnosticEntrySchema>;
