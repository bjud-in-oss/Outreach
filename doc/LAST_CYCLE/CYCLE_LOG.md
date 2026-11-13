# BYGGCYKEL LOGG: TCK-MAINT-062
**Starttid:** 2026-11-13T22:54:20.971Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Vi ska se till att testfasen blir ännu mer robust genom att täta systemet mot att använda mockade funktioner. Samtidigt aktiverar vi en universell städning så att gamla filer rensas effektivt oavsett vilken typ av biljett vi hanterar. Det skapar en renare och mer pålitlig utvecklingsmiljö.


#### 0a Att vända om: Kontraktsaudit
Jag ska nu granska kontraktet och filen `scripts/run-planera-live.ts` för att säkerställa att inga felaktiga beroenden finns.Kontraktet är auditerat och godkänt. Uppdraget stämmer väl överens med våra systemiska krav och kravet på destruktiv sanering utan if-spärrar. Jag är redo att verkställa förändringarna i `scripts/run-planera-live.ts`.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ 1 innebär en direkt stringpatch för båda ändringarna via `apply_patch` där vi exakt matchar och ersätter de två förändringspunkterna.

Alternativ 2 innebär att filen läses in i minnet i sin helhet, där vi utför strängersättningarna och sedan skriver tillbaka filen med `save_code`.

Alternativ 3 bygger på att göra separata patchar för `recoveryPrompt` och städar bort `if-spärren` i två olika operationer.


#### 2c Att vända om: Resiliensgranskning
En resiliensgranskning av alternativen visar att Alternativ 1 är det säkraste spåret. Genom att använda en kirurgisk patch via `apply_patch` för båda förändringspunkterna, säkerställer vi att ändringarna sker atomärt och minimerar risken för fel utan att påverka omgivande kod. Det bygger in en tydlig stoppkloss om förutsättningarna i filen ändras.


#### 2d Att förlikas: Mättnad
Alternativ 1 är fastställt som det vinnande kontraktet. Vi säkerställer atomära ändringar och bygger in nödvändig resiliens. MÄTTNAD: JA.
