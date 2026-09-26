import { z } from 'zod';

/**
 * Standardiserat Event Envelope kontrakt (CloudEvents-kompatibelt)
 * Används för asynkron händelsestyrd kommunikation mellan alla delsystem:
 * Google Drive Sync, WAL Logger, MCP Bridge och Gemini Live Swarm.
 */
export const EventEnvelopeSchema = z.object({
  /** Unik identifierare för händelsen (UUIDv4) */
  id: z.string().min(1, 'Händelse-ID krävs'),
  
  /** Händelsekälla (URI eller modulnamn, t.ex. 'outreach/drive-sync') */
  source: z.string().min(1, 'Källa krävs'),
  
  /** Händelsetyp (t.ex. 'outreach.drive.file_created', 'outreach.wal.entry_appended') */
  type: z.string().min(1, 'Händelsetyp krävs'),
  
  /** Specifikationsversion */
  specversion: z.literal('1.0').default('1.0'),
  
  /** Innehållstyp för data-nyttolasten */
  datacontenttype: z.string().default('application/json'),
  
  /** ISO 8601 tidsstämpel i UTC när händelsen inträffade */
  time: z.string().datetime().or(z.string().min(1)),
  
  /** Själva nyttolasten */
  data: z.record(z.string(), z.unknown()).or(z.unknown()),
  
  /** W3C Trace Context Traceparent för distribuerad spårbarhet */
  traceparent: z.string().optional(),
  
  /** Korrelations-ID för länkade operationer */
  correlationId: z.string().optional(),
  
  /** Eventuella metadata och attribut */
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EventEnvelope<T = unknown> = Omit<z.infer<typeof EventEnvelopeSchema>, 'data'> & {
  data: T;
};
