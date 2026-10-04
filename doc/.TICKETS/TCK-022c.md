# Building Ticket TCK-022c: VAD ZCR Softening & Continuous Microphone Stream Sync

## Mål & Kontext
Aktivt åtgärda VAD-känsligheten i `sessionIntentAudio.ts` genom att mjuka upp Zero-Crossing Rate (ZCR) och RMS-villkoret samt frikoppla mikrofonströmningen från UI-knapptryckningar. Detta säkerställer att vokalsvar når Bidi-kabeln direkt och att alla tre agenter tar emot mikrofonljud parallellt utan att låsa sig i UI-tillståndet.

## Domän & Avgränsning
- Domän: src/features/gemini_live_swarm/
- Exklusiva filer:
  - src/features/gemini_live_swarm/session/sessionIntentAudio.ts
  - src/__tests__/transient_TCK-022c.test.ts (ny)

## Detaljerade Funktionella Krav
1. **ZCR-mjukgörande i `detectSpeechPCM` (`sessionIntentAudio.ts`):**
   - Ändra talanalysen så att hög RMS-energi (tydlig volym) klassas som tal oavsett frekvens:
     `const isSpeech = rms > (rmsThreshold * 1.5) || (rms > rmsThreshold && zcr > zcrThreshold);`
   - Detta förhindrar att dova vokaler eller djupa mansröster med låg ZCR av misstag sorteras bort som tystnad.

2. **Kontinuerligt Mikrofonflöde:**
   - Ta bort kraven på `activeIntent` i `startPCM16Sampling` och `onaudioprocess`.
   - Låt mikrofonen strömma PCM-paket så fort VAD aktiveras, vilket matare alla tre samtida Bidi-kablar oberoende av UI-knappläge.

## Operativt Delta (Bevara vs Sanera)
- **Bevara:** 200 ms Pre-Roll buffert och 500 ms Post-Roll.
- **Sanera/Ersätt:** Ersätt den strikta `&&` ZCR-spärren samt knappspärren `if (!this.activeIntent) return;`.

## Testkriterier
- pnpm verify passerar utan fel.
- Transient test src/__tests__/transient_TCK-022c.test.ts verifierar:
  * Inkommande PCM med hög RMS och låg ZCR identifieras korrekt som `isSpeech === true`.
  * Mikrofon-samplingen producerar PCM-events oberoende av `activeIntent`.