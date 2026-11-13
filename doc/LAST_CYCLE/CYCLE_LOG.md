# BYGGCYKEL LOGG: TCK-062
**Starttid:** 2026-11-13T23:42:06.318Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-062: Konstruktiv kritik i webbmotorn (metaReflection.ts) med 3-vägs triagering, batch-kö och löpande rening

**Måldomän:** `path` (`src/features/path/`)
**Målfiler:** `src/features/path/engine/metaReflection.ts`, `src/features/path/contracts/pathSchema.ts`, `src/features/path/engine/pathOrchestrator.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (förankrat i minnet mot injicerad `SessionAdapter` och tillståndsvariabler utan `vi.fn()`/`vi.spyOn()`) bevisar att:
1. `genereraKonstruktivKritik(adapter, kontext)` i `src/features/path/engine/metaReflection.ts` (< 90 rader, 100 % browser-/VFS-kompatibel utan Node `fs`) returnerar ett validerat objekt enligt `MetaKritikResultatSchema` med `bedomning: 'STOR_SKILLNAD' | 'LITEM_BATCH' | 'AVVISAD_FELAKTIG'`, `kritikText`, `motivering` och valfri `forbattringAtgard`.
2. När `skapaPathOrkestrerare` i `src/features/path/engine/pathOrchestrator.ts` (< 105 rader) kör en cykel med meta-reflektion aktiv:
   - Vid `bedomning === 'STOR_SKILLNAD'`: anropas valfri `onKonstruktivKritik(kritik)` (pauspunkt för UI/användare) och orkestratorn kör **exakt 1 extra förbättringsiteration** med `forbattringAtgard` injicerad i `kontextMinne`.
   - Vid `bedomning === 'LITEM_BATCH'`: läggs posten till i minnets batch-kö (`batchForbattringar`) utan extra iteration, och `rensaGenomfordaBatchPoster(ids)` rensar bort genomförda poster när en batch körts.
   - Vid `bedomning === 'AVVISAD_FELAKTIG'`: körs **ingen** åtgärd, utan posten registreras i `avvisadeForslag` så att den inte upprepas.
3. Även vid `STOR_SKILLNAD` körs aldrig mer än 1 extra meta-iteration per cykel, och befintliga tester i `src/features/path/__tests__/` förblir 100 % gröna.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Ren VFS-/webbläsarkompatibel `src/features/path/engine/metaReflection.ts` (< 90 rader):**
   - Importera ALDRIG `node:fs`, `node:path` eller `child_process`.
   - Exportera `genereraKonstruktivKritik` och `rensaGenomfordaBatchPoster`.
2. **Zod SSOT i `src/features/path/contracts/pathSchema.ts` (< 170 rader):**
   - Definiera `MetaKritikBedomningSchema = z.enum(['STOR_SKILLNAD', 'LITEM_BATCH', 'AVVISAD_FELAKTIG'])` och `MetaKritikResultatSchema` med `z.infer` i `pathSchema.ts` och re-exportera i `model/types.ts`.
3. **Bevara bakåtkompatibilitet i `src/features/path/engine/pathOrchestrator.ts` (< 105 rader):**
   - Gör `onKonstruktivKritik` och `aktiveraMetaKritik` valfria i `skapaPathOrkestrerare` så att `pathOrchestrator.test.ts` och `scripts/__tests__/run-path.test.ts` passerar oförändrat.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Webbversionen sållar och rensar konstruktiv kritik med omdöme**
  Givet att Vägmotorn körs i webbläsaren utan CLI-skript
  När en byggcykel utvärderas av `genereraKonstruktivKritik`
  Så körs `STOR_SKILLNAD` direkt (1 iteration), `LITEM_BATCH` köas och rensas vid batch-körning, och `AVVISAD_FELAKTIG` stoppas med dokumenterad motivering.

**Scenario: ATT VÄNDA OM – Stopp för felaktiga förslag och evighetsloopar**
  Givet att ett förslag bedöms som `AVVISAD_FELAKTIG` eller att 1 extra iteration redan genomförts
  När orkestratorn prövar utfallet
  Så utförs aldrig det felaktiga förslaget och cykeln avslutas deterministiskt.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att `metaReflection.ts`, `pathSchema.ts`, `pathOrchestrator.ts` och tester är uppdaterade
  När `pnpm verify` körs
  Så passerar arkitekturgrindar och hela testsviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Jag har förstått din intention med TCK-062. Målet är att ge webbmotorn förmågan att självständigt utvärdera och triagera kritisk feedback, vilket både förhindrar evighetsloopar och skapar en mjukare process genom batch-hantering för användaren. Jag sätter igång med att planera detta steg för steg.


#### 0a Att vända om: Kontraktsaudit
Jag har genomfört kontraktsauditen för TCK-062. Uppdraget är strikt avgränsat till FSD-domänen `path` och omfattar tre filer. Jag har noterat de strikta radbegränsningarna och kravet på VFS-kompatibilitet för den nya reflektionsmodulen, samt vikten av att bibehålla bakåtkompatibilitet i den befintliga orkestratorn.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Alternativ ett bygger på en tillståndsbaserad injicering i orkestrerarens kontextminne, där utvärderingen sparas och ageras på genom direkta funktionsanrop. Alternativ två introducerar en strikt observatörslogik isolerad inom domänspecifika tillstånd, utan att påverka orkestrerarens huvudflöde. Och alternativ tre modellerar en middleware-liknande sekvens för triageringen som interceptor inom ramen för nästa exekveringssteg.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett ger bäst spårbarhet och direkt kontroll mot evighetsloopar, vilket gör det säkrast för att uppfylla kravet på max en extra iteration. Alternativ två och tre är mer frikopplade men riskerar att komplicera kontraktet i onödan givet våra begränsningar på filstorlek.


#### 2d Att förlikas: Mättnad
Jag slår fast att Alternativ 1 vinner. Det ger bäst spårbarhet och direkt kontroll för att förhindra evighetsloopar, vilket är nödvändigt givet våra begränsningar på filstorlek. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Byggkontraktet för TCK-062 är fastställt. Vi skapar `metaReflection.ts` och uppdaterar kontraktet i `pathSchema.ts` samt modellens `types.ts` för att bibehålla en sömlös integration med `pathOrchestrator.ts`. Samtliga moduler följer vår strikta radgräns och förblir 100 % VFS-kompatibla.
