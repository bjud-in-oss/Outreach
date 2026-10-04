# Steg 3c: Filoperativ Källkodsspecifikation (TCK-022c)

## 1. GROW Specifikation
- **Goal (Mål)**: Mjuka upp talanalysen i `detectSpeechPCM` så att djupa mansröster och dova vokaler med låg ZCR klassas som tal vid tydlig volym (`rms > rmsThreshold * 1.5`), samt frikoppla mikrofonens sampling i `SessionIntentManager` från kravet på `activeIntent` för att möjliggöra kontinuerlig synkronisering med alla tre agenters Bidi-kablar.
- **Reality (Nuläge)**: `detectSpeechPCM` har ett strikt konjunktivt villkor `rms > rmsThreshold && zcr > zcrThreshold` som klipper dova vokaler med få nollgenomgångar. Dessutom blockeras `onaudioprocess` av `if (!this.activeIntent) return;`, vilket hindrar kontinuerligt mikrofonlyssnande om användaren inte aktivt klickat på en av de tre försoningsknapparna.
- **Options (Alternativ)**: Strikt ZCR med manuellt val vs adaptiv RMS-prioritering med kontinuerligt flöde. Vi väljer adaptiv RMS-prioritering och kontinuerlig sampling för att garantera sömlös och naturlig röstkommunikation.
- **Will (Plan & Åtagande)**: Ändra `detectSpeechPCM` och `startPCM16Sampling`/`onaudioprocess` i `sessionIntentAudio.ts`, samt skapa en transient testsvit `src/__tests__/transient_TCK-022c.test.ts` som validerar röstdetektering av djupa vokaler och intent-oberoende sampling.

## 2. Operativt Delta (Bevara vs Sanera)
- **Bevara**:
  - 200 ms Pre-Roll buffert (`AudioPreRollBuffer`) och 500 ms Post-Roll.
  - Befintliga signaturer för `detectSpeechPCM`, `VadAnalysisResult` och `SessionIntentManager`.
  - Ingen nyckelordssökning eller mockning i produktionskod.
- **Sanera / Ersätta**:
  - Ersätt `rms > rmsThreshold && zcr > zcrThreshold` med `rms > (rmsThreshold * 1.5) || (rms > rmsThreshold && zcr > zcrThreshold)`.
  - Radera `if (!this.activeIntent) return;` inuti `onaudioprocess`.

## 3. Zod- och Typkontrakt
```typescript
export interface VadAnalysisResult {
  isSpeech: boolean;
  rms: number;
  zcr: number;
}
```

## 4. Testkriterier (Transient Mikro-E2E)
- `src/__tests__/transient_TCK-022c.test.ts`:
  1. Kontrollera att låg ZCR med hög RMS (> 1.5 * threshold) detekteras som tal (`isSpeech === true`).
  2. Kontrollera att låg RMS och låg ZCR detekteras som tystnad (`isSpeech === false`).
  3. Kontrollera att normal röst (RMS > threshold && ZCR > threshold) detekteras som tal.
  4. Kontrollera att `processIncomingChunk` i `SessionIntentManager` skickar PCM-händelser även när `activeIntent === null`.
