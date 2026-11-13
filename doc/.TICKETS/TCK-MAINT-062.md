# TCK-MAINT-062: Täta recoveryPrompt mot vi.fn() och aktivera saneraSkordadLegacy utan if-spärr

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:**
1. I `scripts/run-planera-live.ts` (strikt <= 980 rader) uppdateras `recoveryPrompt` (runt rad 404) till: `Gate 3a underkände testet!
FELLOGG:
${err.message || String(err)}
Åtgärda och spara till '${transientTestFile}'. Ta bort all import av 'vi' och ersätt varje vi.fn()/vi.spyOn() med vanliga variabler (let anropad = false;) utan tautologier.

KONTRAKT OCH BAKGRUND:
${startAnchor}`
2. Rad 868 i `scripts/run-planera-live.ts` ändras från `if (!isMaint) saneraSkordadLegacy(ticketPath);` till `saneraSkordadLegacy(ticketPath);` så att skördade filer alltid städas.
3. `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Kirurgisk patch i `scripts/run-planera-live.ts` (<= 980 rader):**
   - Ändra definitionen av `recoveryPrompt` (rad 404) exakt enligt Mekanisk Acceptans.
   - Ändra rad 868 från `if (!isMaint) saneraSkordadLegacy(ticketPath);` till `saneraSkordadLegacy(ticketPath);`.
2. **Bevara alla andra funktioner orörda:** Låt JIT-verktygsanrop, `buildRetryAnchor` och Gate 3a-mekaniken i övrigt vara oförändrad.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Gate 3a-recovery stoppar alibin direkt**
  Givet att `recoveryPrompt` instruerar modellen att byta ut spioner mot tillståndsvariabler
  När ett Gate 3a-fel inträffar
  Så rättar modellen felet utan att byta ut ett alibi mot ett annat.

**Scenario: ATT VÄNDA OM – Universell städning för alla biljettyper**
  Givet att `saneraSkordadLegacy` anropas
  När bygget är grönt
  Så rensas legacy-kön oavsett om det är en funktionsbiljett eller `MAINT`.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att uppdateringarna är på plats
  När `pnpm verify` körs
  Så passerar kompilering och radgränser med exit 0.
