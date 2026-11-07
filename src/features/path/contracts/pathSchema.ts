import { z } from 'zod';

export const FilKravSchema = z.object({
  filVag: z.string().min(1),
  maxRader: z.number().positive().optional(),
  kravsExport: z.boolean().optional(),
});

export const KonstruktionsportOptionsSchema = z.object({
  matris: z.array(FilKravSchema),
  inspekterare: z.custom<Function>(),
  barrelVag: z.string().optional(),
});

export const PathContextSchema = z.record(z.any());

export const PortResultSchema = z.object({
  oppnad: z.boolean(),
  orsak: z.string().optional(),
  omvandelseKrav: z.string().optional(),
});
