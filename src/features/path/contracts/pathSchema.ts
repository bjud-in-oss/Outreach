import { z } from 'zod';

export const PathContextSchema = z.object({
  biljettDatum: z.string().datetime(),
  aktuellFas: z.string(),
  minne: z.record(z.unknown()),
});

export const PortResultSchema = z.object({
  oppnad: z.boolean(),
  orsak: z.string().optional(),
  omvandelseKrav: z.string().optional(),
});
