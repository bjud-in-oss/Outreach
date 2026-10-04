# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-021b)

## 1. Målkonflikter & Förlikning
- **Konflikt**: Ska `apply_code_patch` vid `AMBIGUOUS_SEARCH_BLOCK` kasta ett tekniskt JSON-RPC fel (-32603) eller returnera ett strukturerat svar med `isError: true`?
  - **Förlikning**: Att kasta ett protokollfel (-32603) avbryter agentens tool call loop i Gemini Live och kan orsaka frysning i Bidi-kabeln. Genom att returnera `{ content: [...], isError: true }` ges agenten en direkt pedagogisk system-nudge att precisera sitt sökblock med 2 omgivande rader, vilket gör felhanteringen mjuk och självläkande.
- **Konflikt**: Hur ska `walEngine` och `driveStore` tillhandahållas till verktygshandlern?
  - **Förlikning**: `createCodePatchToolHandlers(walEngine?: WalEngine, driveStoreInstance?: typeof driveStore)` använder default singleton-instanser (`new WalEngine()` och `driveStore`) om inga skickas in, vilket gör både skarp produktion och isolerade enhetstester triviala.

## 2. Konsistenskontroll
- Befintliga verktyg i `mcpServer.ts` bibehålls orörda.
- Samtliga typdefinitioner i `mcpSchema.ts` och `envelope.ts` respekteras.
- `mcpServer.ts` och `codePatchTools.ts` håller sig strikt under tillåtna radgränser.

MÄTTNAD: JA
