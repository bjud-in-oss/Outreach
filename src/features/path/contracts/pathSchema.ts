import { z } from 'zod';

export const PathContextSchema = z.object({
  biljettDatum: z.string().datetime().optional(),
  aktuellFas: z.string().optional(),
  minne: z.record(z.unknown()).optional(),
});

export const PortResultSchema = z.object({
  oppnad: z.boolean(),
  orsak: z.string().optional(),
  omvandelseKrav: z.string().optional(),
});

export const AvsiktsportOptionsSchema = z.object({
  prompter: z.custom<Function>(),
  beskrivning: z.string(),
  exempel: z.string().optional(),
});

export const PathRecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.custom<any>()),
});
