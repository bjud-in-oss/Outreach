# BYGGCYKEL LOGG: TCK-062
**Starttid:** 2026-11-15T20:59:09.576Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-062: Enhetlig Wayfinder-kritik och 3-vägs triagering med papperskorg i metaReflection.ts (Del 1/2)

**Måldomän:** `path` (`src/features/path/`)
**Målfiler:** `src/features/path/contracts/pathSchema.ts`, `src/features/path/engine/metaReflection.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (utan `vi.fn()`/`vi.spyOn()`, ingen Node `fs`) bevisar att:
1. `src/features/path/contracts/pathSchema.ts` (< 215 rader) utökar `MetaKritikBedomningSchema` med `'MAKULERAD_INAKTUELL'`, lägger till `prioritet: z.enum(['HOG', 'MEDEL', 'LAG']).default('MEDEL')` i `MetaKritikResultatSchema` samt uppgraderar kvarvarande `z.record(z.unknown())` / `z.record(z.any())` (i `PathContextSchema` och `CompiledPromptSchema`) till två argument (`z.record(z.string(), z.unknown())` / `z.record(z.string(), z.any())`).
2. `genereraKonstruktivKritik(adapter, kontext)` i `src/features/path/engine/metaReflection.ts` (< 115 rader) returnerar ett Zod-validerat `MetaKritikResultat` i Wayfinder-format (`STOR_SKILLNAD | LITEM_BATCH | AVVISAD_FELAKTIG | MAKULERAD_INAKTUELL`, `prioritet: HOG | MEDEL | LAG`) och behåller bakåtkompatibel export av `rensaGenomfordaBatchPoster`.
3. `omprioriteraBatchQueue(queue, papperskorg, inaktuellaIds?)` **tömmer `papperskorg` allra först**, flyttar inaktuella poster dit och sorterar aktiva poster (`HOG` > `MEDEL` > `LAG`).
4. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här låter som en viktig uppdatering för att hålla ordning på feedbacken och processen. Hur ser behoven ut för hur inaktuella och makulerade poster ska hanteras i er verksamhet för att flödet ska bli så smidigt som möjligt?


#### 0a Att vända om: Kontraktsaudit
Kontraktsauditen för TCK-062 är genomförd. Omfånget är begränsat till domänen `path`, och kraven på z-schemaändringar samt `prioritet` är väl definierade. Vi är redo att gå vidare mot vägvägning för ett smidigt och resilient flöde.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ



#### 2c Att vända om: Resiliensgranskning



#### 2d Att förlikas: Mättnad



#### 3a Att följa: Transient Testspecifikation
För TCK-062 formulerar jag nu en transient testspecifikation i `src/features/path/engine/metaReflection.test.ts`. Testet kommer att validera att `MetaKritikResultatSchema` har den nya prioritetsstyrningen, samt att `genereraKonstruktivKritik` spottar ur sig korrekt `prioritet`, och slutligen att `omprioriteraBatchQueue` korrekt tömmer och sorterar kön enligt vår förlikade triad. Inga spioner eller filsystemsanrop används.


#### 3b Att följa: Källkodsspecifikation
För att uppfylla villkoren i TCK-062 uppdaterar jag nu `pathSchema.ts` och `metaReflection.ts`.

I `contracts/pathSchema.ts` utökar vi `MetaKritikBedomningSchema` med `'MAKULERAD_INAKTUELL'` och lägger till `prioritet` i `MetaKritikResultatSchema`. Vi uppgraderar även `z.record` till att ta två argument där det behövs.

I `engine/metaReflection.ts` implementerar vi `omprioriteraBatchQueue` som rensar papperskorgen, flyttar inaktuella poster och sorterar aktiva poster efter prioritet.


#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Byggkontraktet för TCK-062 är nu spikat och redo för exekvering. Fas 2 initieras, och jag förbereder källkodsuppdateringar för både pathSchema.ts och metaReflection.ts enligt överenskommen strategi.
