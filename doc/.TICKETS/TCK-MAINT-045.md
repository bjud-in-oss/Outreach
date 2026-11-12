# TCK-MAINT-045: Kräv publik ingångspunkt vid test av hjälpmoduler i Steg 3a

**Måldomän:** `scripts`
**Målfiler:** `scripts/run-planera-live.ts`
**Mekanisk Acceptans:** Steg 3a-prompten i `scripts/run-planera-live.ts` innehåller en explicit regel som kräver att när en biljett skapar eller uppdaterar en hjälpmodul (`*Helper.ts`), måste det transienta testet instansiera och anropa domänens publika ingångsklass/orkestrator så att inkopplingen mellan huvudklass och hjälpmodul verifieras mekaniskt. Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skärp Steg 3a-prompten i `scripts/run-planera-live.ts`:**
   - Leta upp `Steg 3a: Generera transient testspecifikation` och lägg till punkt 6 i listan `KRAV FÖR TDD OCH FAIL-FIRST:`:
     `6. PUBLIK INGÅNGSPUNKT (INGA ISOLERADE HJÄLPFILS-ALIBIN): När en biljett skapar eller uppdaterar en hjälpmodul (t.ex. *Helper.ts) MÅSTE testet instansiera och anropa domänens publika ingångsklass/orkestrator (och verifiera beteendet genom den, inte enbart genom direkta anrop till hjälpfilen) så att inkopplingen mellan huvudklass och hjälpmodul bevisas ände-till-ände.`
2. **Bevara övriga faser och skriptinvarianter:**
   - Ändringen berör uteslutande `scripts/run-planera-live.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Hjälpmoduler verifieras genom sin verkliga ingångspunkt**
  Givet att en funktionsbiljett bryter ut logik i en hjälpfil (`*Helper.ts`)
  När Steg 3a genererar det transienta testet
  Så utgår testet från domänens huvudklass i stället för att enbart testa hjälpfunktionerna isolerat
  Och inkopplingen i produktionsflödet garanteras.

**Scenario: ATT VÄNDA OM – Avvisande av oanvända hjälpmoduler**
  Givet att en agent skapar funktioner i en hjälpfil utan att anropa dem från huvudklassen
  När transient-testet körs mot huvudklassen
  Så fallerar testet rött tills huvudklassen faktiskt delegerar till hjälpfilen
  Så att ingen död kod kan passera grönt.

**Scenario: ATT FÖRLIKAS – En helgjuten byggmotor inför TCK-052**
  Givet att `scripts/run-planera-live.ts` är uppdaterad
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.
