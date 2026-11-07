# BYGGCYKEL LOGG: TCK-036
**Starttid:** 2026-11-07T19:57:27.843Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-036: Receptkontraktet och Avsiktsporten med Dialogstöd

## 1. MÅL
Utöka domänen `src/features/path/` med deklarativa recept- och nodtyper (`PathRecipe`, `PathNode`, `StepNode`, `PortNode`), uppdatera `PortNekadError` med `omvandelseKrav`, samt implementera **Avsiktsporten** med stöd för tvättad mänsklig dialog (Enter för bekräftelse, textinmatning för samtal/förtydligande, samt stoppord för kontrollerad omvändelse) enligt ADR-030 och Gherkin-specifikationen i `doc/features/path_execution.feature`.

---

## 2. DESTRUKTIVA HANDLINGSSTEG
Inga filer raderas. Befintliga filer i `src/features/path/` kompletteras enligt Väg 2 (Modulär expansion). Gamla skript i `scripts/` förblir orörda.

---

## 3. IMPLEMENTERINGSSPECIFIKATION FÖR BYGGMOTORN

### A. Recept- och Nodkontrakt (`src/features/path/model/types.ts`)
Komplettera `types.ts` med följande generella byggstenar:

```typescript
export interface BaseNode {
  id: string;
  name: string;
  kraft?: 'följa' | 'vända-om' | 'förlikas';
  maxTokens?: number;
}

export interface StepResult {
  success: boolean;
  data?: unknown;
  tokensUsed?: number;
}

export interface StepNode extends BaseNode {
  type: 'STEP';
  execute: (kontext: PathContext) => Promise<StepResult>;
}

export interface PortNode extends BaseNode {
  type: 'PORT';
  port: Port;
}

export type PathNode = StepNode | PortNode;

export interface PathRecipe {
  id: string;
  name: string;
  description: string;
  nodes: PathNode[];
}

export type Prompter = (fraga: string) => Promise<string>;

export interface AvsiktsportOptions {
  prompter: Prompter;
  beskrivning: string;
  exempel?: string;
}
```

### B. Avsiktsporten (`src/features/path/engine/avsiktsport.ts`)
Skapa fabriksfunktionen `skapaAvsiktsport(options: AvsiktsportOptions): Port`:
- När porten anropas med en `PathContext`, formulera frågan med `options.beskrivning` och eventuellt `options.exempel` och skicka till `options.prompter`.
- **Inmatningstvätt:** Tvätta det erhållna svaret med `const rentSvar = (raaSvar || '').trim().toLowerCase();`.
- **Svarshantering:**
  1. **Bekräftelse:** Tom sträng (`rentSvar === ''`), `'y'`, `'ja'`, `'kör'` eller `'ok'` -> Returnera `{ oppnad: true }`.
  2. **Aktivt stopp:** `'n'`, `'nej'`, `'stopp'` eller `'avbryt'` -> Returnera `{ oppnad: false, orsak: 'Människan avvisade intentionen vid Avsiktsporten', omvandelseKrav: 'AVBRYT' }`.
  3. **Dialog / Förtydligande:** All annan text tolkas som en önskan om förtydligande -> Returnera `{ oppnad: false, orsak: `Människan begärde förtydligande: "${(raaSvar || '').trim()}"`, omvandelseKrav: 'SAMRÅD' }`.

### C. Uppdatering av Kärnlogik & Recept-exekveraren (`src/features/path/engine/pathRunner.ts`)
1. **Utöka `PortNekadError`:**
   ```typescript
   export class PortNekadError extends Error {
     constructor(public orsak?: string, public omvandelseKrav?: string) {
       super(`Port nekad: ${orsak || 'Ingen orsak angavs'}`);
       this.name = 'PortNekadError';
     }
   }
   ```
2. **Uppdatera `knackaPaPorten`:**
   Skicka med båda parametrarna vid fel:
   ```typescript
   if (!resultat.oppnad) {
     throw new PortNekadError(resultat.orsak, resultat.omvandelseKrav);
   }
   ```
3. **Implementera `exekveraRecept`:**
   ```typescript
   export async function exekveraRecept(recipe: PathRecipe, kontext: PathContext): Promise<void>
   ```
   - Itererar sekventiellt över `recipe.nodes`.
   - För `STEP`: Anropar `await node.execute(kontext)`. Om `!result.success` kastas ett fel som avbryter körningen.
   - För `PORT`: Anropar `await knackaPaPorten(node.port, kontext)`. Om porten nekar avbryts körningen omedelbart via `PortNekadError`.

### D. Zod-Scheman & Domänexport (`src/features/path/contracts/pathSchema.ts` och `index.ts`)
- I `pathSchema.ts`: Skapa `AvsiktsportOptionsSchema` och `PathRecipeSchema`. Validera funktionella fält (`prompter`, `execute`, `port`) med `z.custom<Function>()` eller `z.custom<any>()` så att Zod inte kastar fel på körtidsfunktioner.
- I `index.ts`: Exportera samtliga nya typer, scheman och hjälpfunktioner (`skapaAvsiktsport`, `exekveraRecept`, `PortNekadError`, `knackaPaPorten`).

---

## 4. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Skapa `src/features/path/__tests__/avsiktsport.test.ts`.
2. **Körtidsankare & TDD Fail-First:** Testet ska importera `skapaAvsiktsport`, `exekveraRecept`, `PortNekadError` och `knackaPaPorten` från den egna domänen.
3. **Verifiera Avsiktsportens tre utfall och inmatningstvätt:**
   - Enter/Tom sträng eller `" ja "` öppnar porten utan fel (`resolves.not.toThrow()`).
   - Stoppord (`" nej\n"`) kastar `PortNekadError` där `error.omvandelseKrav === 'AVBRYT'`.
   - Textfråga (`" vad innebär detta? "`) kastar `PortNekadError` där `error.omvandelseKrav === 'SAMRÅD'` och bevarar den trimmade frågetexten i `orsak`.
4. **Verifiera Recept-exekveraren:** Kör ett litet mock-recept med minst 1 `StepNode` och 1 `PortNode` och bevisa att exekveringen fungerar deterministiskt i sekvens.
5. **Fil- och radgränser:** Samtliga skapade eller ändrade filer under `src/features/path/` ska strikt hålla sig under 250 rader per fil.
6. `pnpm test` och `node scripts/verify-architecture.js` ska vara 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Givet att en människa vill styra exekveringsflödet genom att bekräfta, avbryta eller samtala om intentionsriktningen, När en Avsiktsport anropas och människan svarar, Så ska körtornsdynamiken antingen fortsätta, avbrytas med status AVBRYT, eller kräva samråd baserat på textinmatningen.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit slutförd: Uppdraget omfattar enbart en FSD-domän, följer Väg 2-principen för modulär expansion utan destruktiva steg, och uppfyller alla kontraktstvättningskrav inför intentionstvätten.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-036 formulerar jag tre ortogonala alternativ för lösning.

Alternativ 1: Funktionell fabrik med injicerad prompter. Vi följer kontraktet strikt med rena fabriksfunktioner där promptern skickas med som beroende.

Alternativ 2: Objektorienterad inkapsling för kontextuell exekvering. Vi paketerar receptet och portens logik i en klassstruktur för bättre tillståndshantering och framtida utökningar.

Alternativ 3: Händelsedriven exekvering via EventBus. Vi integrerar körtidssteg med SwarmEventBus för att logga livscykelhändelser och möjliggöra spårbarhet för mänsklig nytta.


#### 2c Att vända om: Resiliensgranskning
En resiliensgranskning av alternativen visar att Alternativ 1 erbjuder högst resiliens genom sin statslösa funktionella struktur, vilket döljer risker för latenta haverier. Alternativ 2 riskerar tillståndskollisioner, medan Alternativ 3 kräver strikt synkron hantering för att undvika race-condtions i händelsebussen. Vi väljer Alternativ 1 för maximal exekveringsresiliens.


#### 2d Att förlikas: Mättnad
Efter avvägning och syntetisk vägning av alla alternativ står det klart att Alternativ 1 är vinnaren. Vi deklarerar nu MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Filer att skapa och bevara i index ts inkluderar model types ts för de nya nodtyperna och receptkontraktet, contracts pathSchema ts för validering, engine avsiktsport ts för dialoglogik, engine pathRunner ts med den uppdaterade PortNekadError och exekveraren, samt __tests__ avsiktsport test ts för verifiering.
