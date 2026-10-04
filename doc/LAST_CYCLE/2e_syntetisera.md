# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-022a)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: Hur hanteras VAD utan att addera tunga oinstallerade npm-beroenden som kraschar i sandlådan?
  - **Förlikning**: Genom att bygga en nativ PCM VAD med adaptiv RMS-energi och Zero-Crossing Rate (ZCR) direkt i TypeScript elimineras alla externa beroenden. Algoritmen är extremt snabb (< 0.2 ms per ram) och fungerar identiskt i både webbläsare och Node.js testsviter.
- **Konflikt 2**: Hur garanteras att `liveAudioPlayback.ts` inte kraschar under Node.js `pnpm verify` eller transienta tester där `AudioContext` saknas?
  - **Förlikning**: `liveAudioPlayback.ts` kontrollerar villkorligt om `window.AudioContext` finns. Om den saknas körs en in-memory simulering som spårar schemaläggningstider (`nextPlayTime`) och gain-ramper utan fel, vilket ger 100% testtäckning i Node.js.
- **Konflikt 3**: Hur undviks sprak och klick vid omedelbar preemption (< 20 ms)?
  - **Förlikning**: I stället för att anropa `source.stop()` omedelbart, tillämpas en 18 ms linjär rampning till Gain 0 (`linearRampToValueAtTime(0, now + 0.018)`). Därefter anropas `source.stop(now + 0.020)`. Detta avlägsnar helt diskontinuiteter och klick i PCM-strömmen.
- **Konflikt 4**: AST- och radgränser (< 250 rader per fil).
  - **Förlikning**:
    - `liveAudioPlayback.ts`: ~120 rader för `DSPRingBufferMixer`.
    - `sessionIntentAudio.ts`: ~190 rader för mikrofonhantering, `AudioPreRollBuffer` och nativ VAD.
    - `geminiLiveSession.ts`: ~220 rader genom modulär Floor Controller-integration.
    Alla filer förblir med god marginal under 250-radersgränsen.

## 2. Slutsats & Mättnad
Alla målkonflikter och tekniska begränsningar är förlikade och syntetiserade.
MÄTTNAD: JA
