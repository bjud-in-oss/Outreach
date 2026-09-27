# 2b Modellera: Tyst Röstspärr & Namnutlöst Ljudaktivering i Live-gränssnittet (TCK-011)

## 1. Domän- och Kontraktsmodellering

### 1.1 AudioOutputState och Zod-kontrakt
```typescript
export const AudioTriggerReasonSchema = z.enum([
  'DEFAULT_SILENCE',
  'NAME_INVOCATION',
  'TOKEN_GATE',
  'MANUAL_UNMUTE',
]);
export type AudioTriggerReason = z.infer<typeof AudioTriggerReasonSchema>;

export const AudioOutputStateSchema = z.object({
  isMuted: z.boolean(),
  activeSpeakerUnitId: z.string().optional(),
  activeForce: AgentForceSchema.optional(),
  triggerReason: AudioTriggerReasonSchema.optional(),
  lastChangedAt: z.string(),
});
export type AudioOutputState = z.infer<typeof AudioOutputStateSchema>;
```

### 1.2 Namndetektionsfunktion (Deterministic Invocation Matcher)
```typescript
export interface InvocationMatch {
  unitId: string;
  force: ReconciliationForce;
  matchedPhrase: string;
}

export function detectUnitInvocation(input: string): InvocationMatch | null {
  const normalized = input.toLowerCase();

  // 1. Att följa Guds son
  if (
    normalized.includes('att följa') ||
    normalized.includes('följa sonen') ||
    normalized.includes('guds son') ||
    normalized.includes('sonen')
  ) {
    return {
      unitId: 'unit-att-folja',
      force: 'ATT_FOLJA',
      matchedPhrase: 'Att följa Guds son',
    };
  }

  // 2. Att vända om till Gud
  if (
    normalized.includes('att vända om') ||
    normalized.includes('vända om') ||
    normalized.includes('vända om till gud')
  ) {
    return {
      unitId: 'unit-att-vanda-om',
      force: 'ATT_VANDA_OM',
      matchedPhrase: 'Att vända om till Gud',
    };
  }

  // 3. Att förlikas med Gud
  if (
    normalized.includes('att förlikas') ||
    normalized.includes('förlikas med gud') ||
    normalized.includes('förlikas')
  ) {
    return {
      unitId: 'unit-att-forlikas',
      force: 'ATT_FORLIKAS',
      matchedPhrase: 'Att förlikas med Gud',
    };
  }

  // 4. Att försonas (ensam agent)
  if (
    normalized.includes('att försonas') ||
    normalized.includes('försonas') ||
    normalized.includes('ensam agent') ||
    normalized.includes('seriell motor')
  ) {
    return {
      unitId: 'unit-seriell-motor',
      force: 'SERIELL_MOTOR',
      matchedPhrase: 'Att försonas (ensam agent)',
    };
  }

  return null;
}
```

### 1.3 CloudEvents 1.0 Specifikation för Ljudtillstånd
- **Typ**: `swarm.audio.state.changed`
- **Källa**: `outreach/gemini_live/audio_gate`
- **Data**:
  ```json
  {
    "isMuted": false,
    "activeSpeakerUnitId": "unit-seriell-motor",
    "activeForce": "SERIELL_MOTOR",
    "triggerReason": "TOKEN_GATE",
    "lastChangedAt": "2026-09-27T19:22:00.000Z"
  }
  ```
