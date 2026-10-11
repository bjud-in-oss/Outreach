import { z } from 'zod';

export const VoiceFlowMetricsSchema = z.object({
  vadLatencyMs: z.number().max(800),
  engineTtftMs: z.number().max(1200),
  isThreadIsolated: z.boolean(),
  isPaused: z.boolean().default(false),
  timestamp: z.string().default(() => new Date().toISOString()),
});

export type VoiceFlowMetrics = z.infer<typeof VoiceFlowMetricsSchema>;

export function measureVoiceFlow(vadLatencyMs: number, engineTtftMs: number, isThreadIsolated = true): VoiceFlowMetrics {
  return VoiceFlowMetricsSchema.parse({
    vadLatencyMs,
    engineTtftMs,
    isThreadIsolated,
    isPaused: false,
    timestamp: new Date().toISOString(),
  });
}
