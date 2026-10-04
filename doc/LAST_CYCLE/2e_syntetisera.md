# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-022a)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: Hur förhindrar vi sprak och klick vid omedelbar preemption när en agent talar?
  - **Förlikning**: Omedelbar brytning utan ramp genererar klickljud på grund av diskontinuiteter i vågformen. Genom att använda `gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.018)` rampar vi ner på < 20 ms. Detta är klickfritt och upplevs samtidigt som omedelbart av användaren. Därefter stoppas aktiva `AudioBufferSourceNode` efter 20 ms.
- **Konflikt 2**: Ska alla tre agenter köra via samma WebSocket eller separata Bidi-anslutningar?
  - **Förlikning**: Gemini Live Bidi-protokollet tillåter en aktiv röst/session per WebSocket-anslutning (`voiceName` sätts i `setup`). För att ha tre oberoende personligheter och röster (*Puck*, *Charon*, *Aoede*) måste tre parallella Bidi-anslutningar hållas öppna. Floor Control ser till att bara den aktiva talaren streamar ljud ut till mixerbussen.
- **Konflikt 3**: Filstorleksgränser och AST-mått (max 250 rader per fil).
  - **Förlikning**: Bryt tydligt upp ansvaret:
    - `liveAudioPlayback.ts`: DSPRingBufferMixer och Web Audio API noder.
    - `sessionIntentAudio.ts`: Mikrofon, resampling och AudioPreRollBuffer.
    - `geminiLiveSession.ts`: Bidi-klient, Floor Controller och händelseorkestrering.
    Alla tre filerna hålls under 240 rader för att inte bryta AST-måtten.

## 2. Slutsats & Mättnad
Alla målkonflikter är syntetiserade och avgränsade.
MÄTTNAD: JA
