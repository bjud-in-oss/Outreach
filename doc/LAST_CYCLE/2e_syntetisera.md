# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-020d)

## 1. Målkonflikter & Förlikning
- **Konflikt**: Tidigare implementation förlitade sig på `modelName = 'gemini-3.8-flash'` som en dold fallback i `generateAgentTurn`, samtidigt som live-strömningen använde `gemini-3.8-live-extended-thinking`.
  - **Förlikning**: Ta bort den hårdkodade `modelName`-variabeln helt. Låt `generateAgentTurn` använda explicit angiven modell eller falla tillbaka på `this.liveModelName`, vilket harmoniserar hela sessionen under samma försoningsmotor.
- **Konflikt**: Standardanrop till `@google/genai` för WebSocket-kabeln kunde förhandla mot `v1beta`, vilket orsakade skillnader i protokollbeteende och saknat stöd för vissa Live API-funktioner.
  - **Förlikning**: Explicit skicka `{ apiVersion: 'v1alpha' }` till `GoogleGenAI`, vilket garanterar att WebSocket-anslutningen alltid pekar på `v1alpha.generativeservice.BidiGenerateContent`.

## 2. Konsistenskontroll
- Inga brutna referenser i `swarmOrchestrator.ts` eller andra moduler.
- `getApiVersion()` bekräftar `'v1alpha'`.
- AST- och radgränser respekteras (filen hålls under 240 rader).

MÄTTNAD: JA
