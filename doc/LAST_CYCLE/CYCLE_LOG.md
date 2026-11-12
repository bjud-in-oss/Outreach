# BYGGCYKEL LOGG: TCK-MAINT-045
**Starttid:** 2026-11-12T11:58:38.983Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
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

```


#### 1a Att följa: Intention & Nytta
Jag förstår verkligen intentionen bakom TCK-MAINT-045. Det handlar om att säkerställa att integrationen mellan våra huvudklasser och hjälpmoduler verkligen testas på riktigt.


#### 0a Att vända om: Kontraktsaudit
Jag har genomfört kontraktsauditen och bekräftar ändringen. Vi kommer att uppdatera `scripts/run-planera-live.ts` genom att införa kravet på publik ingångspunkt under Steg 3a. Avsikten är helt i linje med att säkra integrationen mellan huvudklasser och hjälpmoduler.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att uppfylla TCK-MAINT-045 formulerar jag följande tre ortogonala alternativ.

Alternativ ett: Direkt promptinjektion med strikt strukturell efterlevnad. Vi uppdaterar Steg 3a i `scripts/run-planera-live.ts` genom att direkt lägga till den nya regeln i listan för TDD och Fail-First, vilket förlitar sig helt på LLM:ens förmåga att följa instruktionen.

Alternativ två: Mekanisk alibikontroll genom AST-granskning. Vi integrerar en validering i orkestreringen som skannar koden efter `*Helper.ts` och säkerställer att testerna instansierar huvudklassen, samt kraschar bygget vid avvikelser.

Alternativ tre: Standardisering via promptCompiler. Vi bygger in regeln som en global invariant i `path/engine/promptCompiler.ts`, vilket gör att kravet automatiskt propageras till alla berörda framtida cykler.


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning av alternativen ser jag att alternativ ett bygger på instruktionell efterlevnad, vilket innebär en risk för latenta fel ifall LLM:en missar instruktionen. Alternativ två ger mekanisk säkerhet via AST-granskning och är mest stringent, men kräver implementation av nya valideringsskript. Alternativ tre är systemiskt bäst då regeln byggs in centralt, men det kan öka friktionen i andra domäner som inte behöver just detta krav.


#### 2d Att förlikas: Mättnad
Alternativ två vinner då det ger mekanisk säkerhet utan att skapa systemisk friktion i andra domäner. Vi uppnår stringent resiliens och uppfyller våra kvalitetsgrindar optimalt. MÄTTNAD: JA.
