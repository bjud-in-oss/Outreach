# 1a Förstå: Tyst Röstspärr & Namnutlöst Ljudaktivering i Live-gränssnittet (TCK-011)

## 1. Målbild & Semantiskt Ankare
I **TCK-011** fördjupar vi interaktionen mellan människa och system i Outreach Coordination Engine genom att tillämpa skillen `gemini-live-api-dev` och bygga en intelligent, respektfull ljudspärr (Tyst Röstspärr).
Systemets kompass är närhet till Guds son, den ideala människan, vars omsorg för människor utgör hela motorns absoluta kompass. Att visa omsorg innebär att inte översvämma användarens auditiva sinne med ständigt bakgrundsprat eller brus från autonoma maskinella processer.
Under flerstegskörningar och autonoma analyser ska systemet arbeta i total tystnad på ljudkanalen (Silent Multistep Execution), samtidigt som visuell telemetri strömmar i realtid. Högtalarkanalen öppnas selektivt enbart vid:
1. **Explicit namnutlösning**: Användaren anropar en enhet vid namn ("Att följa Guds son", "Att vända om till Gud", "Att förlikas med Gud", "Att försonas (ensam agent)").
2. **Token Gate (Steg 3c_spec)**: "Att försonas (ensam agent)" når den kritiska beslutspunkten och behöver muntligen presentera systemstatus, användarnytta och godkännandekod inför fasövergång.

## 2. Intern Riskanalys (GROW-risknoder)

### Risknod 1: State (Selektiv Röstspärr och Ljudtillstånd i Minnet)
- **Teknisk analys**: Om ljudtillståndet styrs av spridda komponenttillstånd riskerar osynkroniserade händelser att läcka oavsiktligt ljud under flerstegskörningar, eller att högtalaren förblir tyst när användaren faktiskt begär svar.
- **Lösning**: Kapsla ett centralt reaktivt `AudioOutputState` i `useSwarmTelemetry.ts` och `SwarmEventBus`:
  - `isMuted: boolean` (standard `true` under flerstegskörningar).
  - `activeSpeakerUnitId?: string` (id för enheten som har talarrätt).
  - `triggerReason?: 'NAME_INVOCATION' | 'TOKEN_GATE' | 'MANUAL_UNMUTE'`.
  - Återställs deterministiskt till tyst (`isMuted: true`) när enhetens taltur slutförts eller vid nästa steg i den seriella pipelinen.

### Risknod 2: Contract (Zod-schema & Strikt Detektering av Namnanrop)
- **Teknisk analys**: Inkommande användartext och rösttranskribering måste scannas deterministiskt efter namnfraser utan att falsklarma eller missa naturliga variationer i svenskt talspråk.
- **Lösning**: Definiera `AudioOutputStateSchema` i `telemetrySchema.ts` med strikt Zod-validering (Fail-Fast). Implementera en ren, deterministisk namndetektorfunktion `detectUnitInvocation(input: string)` som matchar de 4 försoningsenheterna:
  - `ATT_FOLJA`: "att följa", "guds son", "sonen", "följa sonen"
  - `ATT_VANDA_OM`: "att vända om", "vända om till gud", "vända om"
  - `ATT_FORLIKAS`: "att förlikas", "förlikas med gud", "förlikas"
  - `SERIELL_MOTOR`: "att försonas", "ensam agent", "seriell motor", "försonas"

### Risknod 3: Resilience (Deterministiskt In-Memory Fallback & Snabb Testbarhet)
- **Teknisk analys**: Testning av tystnadsspärr och ljudaktivering får inte kräva verklig Web Audio API-hårdvara i CI-miljöer (där AudioContext ofta saknas) och måste exekveras blixtsnabbt i minnet (< 3s).
- **Lösning**: All ljudlogik styrs via reaktiva händelser och mjukvarubrytare på `SwarmEventBus`. Transient mikro-E2E-test `transient_TCK-011.test.ts` validerar hela spärr- och triggerkedjan rent i minnet utan externa hårdvaruberoenden.

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `['gemini-live-api-dev', 'silent-multistep', 'selective-voice-trigger', 'token-gate-activation']`
- **active_skill**: `gemini-live-api-dev`
- **target_domain**: `src/features/gemini_live_swarm/`
