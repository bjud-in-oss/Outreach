import { z } from 'zod';

export const ReflectionModeSchema = z.enum(['normal', 'mikro', 'makro', 'meta']).default('normal');
export type ReflectionMode = z.infer<typeof ReflectionModeSchema>;

export const REFLECTION_MODE_EVENT = 'UI_REFLECTION_MODE_CHANGED';

export const ReflectionModeEventPayloadSchema = z.object({
  mode: ReflectionModeSchema,
  timestamp: z.string().optional(),
});
export type ReflectionModeEventPayload = z.infer<typeof ReflectionModeEventPayloadSchema>;

export interface ReflectionModeOption {
  id: ReflectionMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const REFLECTION_MODES: ReflectionModeOption[] = [
  { id: 'normal', label: 'Normal', shortLabel: 'Norm', description: 'Ren debriefing och omedelbar tystnad' },
  { id: 'mikro', label: 'Mikro', shortLabel: 'Mikr', description: 'Lokal VFS-oscillation och putsning av kod' },
  { id: 'makro', label: 'Makro', shortLabel: 'Makr', description: 'Systemutblick och avknoppning av arkitekturförslag' },
  { id: 'meta', label: 'Meta', shortLabel: 'Meta', description: 'Processutvärdering av AGENTS.md och rutiner' },
];

export function parseReflectionMode(val: unknown): ReflectionMode {
  return ReflectionModeSchema.parse(val);
}

export function isValidReflectionMode(val: unknown): val is ReflectionMode {
  return ReflectionModeSchema.safeParse(val).success;
}

export function getReflectionModeStyle(mode: ReflectionMode, activeMode: ReflectionMode): string {
  if (mode === activeMode) {
    return 'bg-slate-700 text-emerald-300 font-semibold shadow-sm border-slate-600';
  }
  return 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent';
}
