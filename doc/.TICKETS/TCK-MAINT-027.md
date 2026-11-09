# TCK-MAINT-027: Skarp BidiLive-koppling och Dry-Run i run-path.ts

## 1. MÅL
Aktivera skarp nätverksorkestrering i `scripts/run-path.ts` via flaggan `--live` med hjälp av `skapaBidiLiveAdapter`, samt stöd för `--dry-run` för riskfri prompt- och portverifiering. Standardläget utan `--live` ska förbli blixtsnabbt och nätverksoberoende.

## 2. INFRASTRUKTURSPECIFIKATION
Berörda filer: `scripts/run-path.ts`, `scripts/__tests__/run-path.test.ts`.

1. `scripts/run-path.ts`:
   - Importera `skapaBidiLiveAdapter` från `../src/features/path`.
   - Läs in flaggorna `--live` och `--dry-run` från `argv`.
   - Vid `--dry-run`: Sätt en flagga i kontexten och logga: `   🛡️ [DRY-RUN]: Skarpt läge utan diskmodifiering aktivt.`.
   - Vid `--live`:
     * Instansiera `skapaBidiLiveAdapter` med konfiguration från `process.env` (`apiKey: process.env.GEMINI_API_KEY`, `model: process.env.LIVE_MODEL || 'gemini-3.8-live'`, `modality: (process.env.BIDI_MODALITY as any) || 'AUDIO'`).
     * Klientfabriken skapar en live-klient som ansluter till Gemini Live och exponerar `connect`, `send`, `stream` och `close` enligt adapterns kontrakt.
   - Utan `--live`: Använd befintlig mock-adapter med syntetiska svar för omedelbar och nätverksoberoende testning.

2. `scripts/__tests__/run-path.test.ts`:
   - Verifiera att `exekveraRunPath` hanterar flaggan `--dry-run` utan fel.
   - Verifiera att en injicerad `adapter` eller `clientFactory` exekverar framgångsrikt med `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. `scripts/run-path.ts` stöder både standard mock, `--dry-run` och `--live`.
2. Samtliga 20 testfiler i `pnpm test` passerar 100 % gröna.
3. `pnpm verify` passerar 100 % grön.
4. Trepunktsbesiktningen godkänns manuellt med `j`.
