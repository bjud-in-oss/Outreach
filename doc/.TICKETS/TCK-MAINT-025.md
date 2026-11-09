# TCK-MAINT-025: Dynamisk Modalietsväxling (BIDI_MODALITY) för BidiLiveSession

## 1. MÅL
Inför en miljövariabel `BIDI_MODALITY` i `scripts/bidiLiveRunner.ts` för att låta användaren tvinga Bidi Live-strömmen till ren text (`TEXT`) när ljudbuffertar (`AUDIO`) kraschar eller fastnar i 120s-timeout, utan att påverka default-beteendet.

## 2. INFRASTRUKTURSPECIFIKATION
Berörd fil: `scripts/bidiLiveRunner.ts`.

1. `scripts/bidiLiveRunner.ts`:
   - Läs in miljövariabeln `BIDI_MODALITY`.
   - Om `BIDI_MODALITY` är satt till `'TEXT'`, sätt `responseModalities: ["TEXT"]` i `connectConfig`.
   - Radera eller uteslut `outputAudioTranscription` om modaliteten är `TEXT` (eftersom det orsakar API-fel om man begär transkription på en text-only anslutning).
   - Annars, behåll nuvarande default: `responseModalities: ["AUDIO"]` med `outputAudioTranscription: {}`.

## 3. ACCEPTANSKRITERIER
1. `pnpm verify` passerar 100 % grön (inga syntax- eller TS-fel introduceras).
2. Trepunktsbesiktningen i slutet av körningen visar exakt de tillagda raderna och godkänns manuellt med `j`.
