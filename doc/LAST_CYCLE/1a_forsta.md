# Steg 1a: Förstå & Riskanalys (TCK-022c)

Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjulhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.

## 1. Användarorientering & Ärendekontext
- **Ticket**: TCK-022c: VAD ZCR Softening & Continuous Microphone Stream Sync
- **Mål**: Mjuka upp VAD-kriteriet (Zero-Crossing Rate och RMS) i `sessionIntentAudio.ts` samt avlägsna beroendet av `activeIntent` i mikrofon- och PCM-pipelinen. Detta möjliggör att mikrofonströmmen sänder taldata till alla 3 Bidi-kablar parallellt så snart röstenergi detekteras, utan att användaren tvingas låsa sig i ett specifikt UI-tillstånd.

## 2. GROW Risknoder
- **State (Tillståndsrisk)**:
  - *Risk*: Om `isVadStreaming` och pre-roll körs utan `activeIntent`, kan oavsiktliga bakgrundsljud strömmas till WebSocket-kablarna om inte VAD-trösklarna är balanserade.
  - *Mitigering*: Den uppmjukade formeln `rms > (rmsThreshold * 1.5) || (rms > rmsThreshold && zcr > zcrThreshold)` säkerställer att lågfrekvent brus med låg RMS fortfarande ignoreras, medan tydliga vokaler och kraftig röstenergi (över 1.5x tröskeln) släpps igenom utan ZCR-krav.
- **Contract (Kontraktsrisk)**:
  - *Risk*: Befintliga tester som förlitar sig på `SessionIntentManager` eller `detectSpeechPCM` kan påverkas om returtyper eller funktionssignaturer förändras.
  - *Mitigering*: `VadAnalysisResult` (`isSpeech: boolean; rms: number; zcr: number`) och signaturerna för `detectSpeechPCM` och `SessionIntentManager` behålls 100% bakåtkompatibla.
- **Resilience (Återhämtningsrisk)**:
  - *Risk*: Om mikrofonen samplar kontinuerligt i webbläsaren utan `activeIntent` kan AudioContext resurser konsumeras i onödan.
  - *Mitigering*: `ensureAudioContext` och `stopAudioStream` bibehåller kontrollerad resurshantering. I Node.js-testmiljöer mockas varken Web Audio eller navigator, utan funktionerna anpassas för att hantera icke-browser miljöer graciöst.
