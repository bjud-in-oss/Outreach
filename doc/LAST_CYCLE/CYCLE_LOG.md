# BYGGCYKEL LOGG: TCK-046
**Starttid:** 2026-11-09T22:33:18.604Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-046: Domänharmonisering, Polyglott Promptstöd och Portfas-spårning

## 1. MÅL
Gör `src/features/path/engine/bidiLiveAdapter.ts` polyglott så att den hanterar både systemInstruction/userPrompt och instructions/renderedContent, samt bredda `bestamFasForSteg` i `src/features/path/engine/pathRunner.ts` så att även portnoderna (p1–p4 och port-*) tilldelas sina korrekta faser deterministiskt.

## 2. KÄLLKODSSPECIFIKATION FÖR DOMÄNEN
Måldomän: `src/features/path/` (Max 250 rader per logikfil).

1. `src/features/path/engine/bidiLiveAdapter.ts`:
   - Extrahera systeminstruktion och användarinnehåll polyglott:
     ```typescript
     const instruction = prompt.systemInstruction || prompt.instructions || '';
     const content = prompt.userPrompt || prompt.renderedContent || '';
     ```
   - Använd `instruction` och `content` vid `client.send({ instruction, content })`.
   - Säkra att `tokensAnvanda` beräknas och returneras pålitligt.

2. `src/features/path/engine/pathRunner.ts`:
   - Uppdatera `bestamFasForSteg(stegId: string): string`:
     ```typescript
     export function bestamFasForSteg(stegId: string): string {
       const s = stegId.toLowerCase();
       if (s.includes('avsikt') || s.startsWith('step-0') || s.startsWith('step-1a') || s === 'p1') {
         return 'avsikt';
       }
       if (s.includes('provning') || s.startsWith('step-1b') || s.startsWith('step-2') || s.startsWith('step-3') || s === 'p2') {
         return 'provning';
       }
       if (s.includes('konstruktion') || s.startsWith('step-fas2') || s === 'p3') {
         return 'konstruktion';
       }
       if (s.includes('besiktning') || s.startsWith('step-fas3') || s === 'p4') {
         return 'besiktning';
       }
       return 'avsikt';
     }
     ```

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Det transienta testet `src/__tests__/transient_TCK-046.test.ts` ska:
   - Testa att `bestamFasForSteg('p2')` returnerar 'provning' och `bestamFasForSteg('port-konstruktion')` returnerar 'konstruktion'.
   - Testa att `skapaBidiLiveAdapter` skickar prompt med `systemInstruction` och `userPrompt` till klienten och returnerar ackumulerat svar.
2. Testet ska fallera rött mot repots befintliga kod (Fail-First) innan källkoden patchas.
3. Efter implementation ska samtliga tester i `pnpm verify` passera 100 % gröna.

```


#### 1a Att följa: Intention & Nytta
Förståelsen för TCK-046 är glasklar: vi harmoniserar domänen genom att göra våra komponenter polyglotta så att olika gränssnitt kan samverka sömlöst. Den mänskliga nyttan ligger i en mer robust och förutsägbar användarupplevelse.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit för TCK-046 är nu slutförd. Jag har verifierat att samtliga ändringar ryms inom samma FSD-domän under src/features/path/ och att API-kontrakten följs. Inga avvikelser eller behov av destruktiv sanering har identifierats. Vi är redo att gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-046 och harmonisera domänen formulerar jag härmed tre ortogonala alternativ. Alternativ 1 är en direkt implementation med villkorlig extrahering och enkel if-else-logik, vilket är simpelt och uppfyller kraven direkt. Alternativ 2 introducerar en dedikerad normaliseringsfunktion för prompter och reguljära uttryck för fasbestämning för ökad modularitet. Alternativ 3 bygger på en konfigurationskarta för faser och ett utbyggbart normaliseringsmönster, vilket ger maximal flexibilitet och avkoppling av logik.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 har högsta resiliensen tack vare sin enkelhet, då risken för dolda fel eller komplexa avbrott minimeras vid källkodskritiska uppdrag. Alternativ 2 och 3 riskerar mer friktion i framtida modulbyggen.


#### 2d Att förlikas: Mättnad
Med utgångspunkt i analysen av resiliens och enkelhet slår jag fast att Alternativ 1 är det vinnande valet. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Jag bekräftar det slutgiltiga byggkontraktet för TCK-046. Vi kommer att skapa det transienta testet src/__tests__/transient_TCK-046.test.ts och därefter uppdatera källkoden i src/features/path/engine/bidiLiveAdapter.ts samt src/features/path/engine/pathRunner.ts enligt specifikationerna. Vi är redo för Fas 2.
