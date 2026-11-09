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

export const ProvningsportOptionsSchema = z.object({
  testFilVag: z.string(),
  forvantatFel: z.string(),
  testExekverare: z.custom<Function>(),
});

export const FilKravSchema = z.object({
  filVag: z.string(),
  maxRader: z.number().optional(),
  kravsExport: z.boolean().optional(),
});

export const KonstruktionsportOptionsSchema = z.object({
  matris: z.array(FilKravSchema),
  inspekterare: z.custom<Function>(),
  barrelVag: z.string().optional(),
});

export const BesiktningsportOptionsSchema = z.object({
  inspekterare: z.custom<Function>(),
});

export const LeanReceptOptionsSchema = z.object({
  avsikt: z.custom<Function>(),
  provning: z.custom<Function>(),
  konstruktion: z.custom<Function>(),
  besiktning: z.custom<Function>(),
});

export const ClassicReceptOptionsSchema = z.object({
  avsikt: z.custom<Function>(),
  provning: z.custom<Function>(),
  konstruktion: z.custom<Function>(),
  besiktning: z.custom<Function>(),
  stegExekverare: z.custom<Function>().optional(),
});

export const PathRecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(z.custom<any>()),
});
