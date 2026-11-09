import { z } from 'zod';

export const PathPhaseSchema = z.enum(['avsikt', 'provning', 'konstruktion', 'besiktning']);

export const PromptCompileInputSchema = z.object({
  fas: PathPhaseSchema,
  stegId: z.string(),
  ticketId: z.string(),
  malDoman: z.string(),
  uppdrag: z.string(),
  biljettText: z.string().optional(),
  kontextMinne: z.record(z.unknown()).optional(),
});

export const CompiledPromptSchema = z.object({
  systemInstruction: z.string(),
  userPrompt: z.string(),
  beraknadeTokensUngefar: z.number(),
});

export type PathPhase = z.infer<typeof PathPhaseSchema>;
export type PromptCompileInput = z.infer<typeof PromptCompileInputSchema>;
export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;
