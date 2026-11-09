# BYGGCYKEL LOGG: TCK-MAINT-024
**Starttid:** 2026-11-09T20:49:04.946Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-024: Fallback-svar i run-path MockAdapter och Etablering av Integrationstest

## 1. MÅL
Gör mock-adaptern i `scripts/run-path.ts` kapabel att hantera `classic`-receptets alla steg genom syntetiska fallback-svar vid provkörning, samt skapa det permanenta integrationstestet `scripts/__tests__/run-path.test.ts`.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-path.ts`:
   - Om `options.adapter` inte skickas med, instansiera mock-adaptern med en dynamisk fallback:
     ```typescript
     const adapter = options.adapter || {
       skicka: async (prompt: any) => {
         const stegMatch = prompt.userPrompt.match(/StegId: ([^\n]+)/);
         const stegId = stegMatch ? stegMatch[1].trim() : 'okänt-steg';
         io.log(`   ⚡ [STEG: ${stegId}] Prompt kompilerad (${prompt.beraknadeTokensUngefar || 50} tokens) -> Exekverar.`);
         return { svar: `Syntetiskt källkodssvar för ${stegId}`, tokensAnvanda: 50 };
       }
     };
     ```

2. `scripts/__tests__/run-path.test.ts`:
   - Importera `exekveraRunPath` från `../run-path`.
   - Skapa ett Vitest-test som verifierar att `exekveraRunPath({ argv: [] })` (lean) returnerar `success: true` och `slutfold: true`.
   - Skapa ett Vitest-test som verifierar att `exekveraRunPath({ argv: ['--classic'] })` (classic) exekverar delstegen och returnerar `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. Både `pnpm bygg:path TCK-MAINT-024` och `pnpm bygg:path TCK-MAINT-024 --classic` passerar grönt utan krascher.
2. `pnpm test` körs med 17 gröna testfiler.
3. Trepunktsbesiktningen visar att båda filerna hanterats inför godkännande med `j`.

```


#### 1a Att följa: Intention & Nytta
För att säkerställa stabilitet och pålitlig testbarhet i systemets exekveringskedja formulerar jag följande Gherkin-scenario för att fånga er intention.

Givet att vi saknar en aktiv nätverksadapter vid körning i `scripts/run-path.ts`, när ett recept exekveras, så kommer den inbyggda mock-adaptern att generera syntetiska svar baserade på det specifika StegId-värdet i prompten. Så att processen fullföljs sömlöst och verifieras genom ett formellt integrationstest i Vitest som bekräftar korrekt exekvering för både `lean`- och `classic`-recepten.


#### 0a Att vända om: Kontraktsaudit
Detta uppdrag faller under systemunderhåll och sker utanför FSD-domänerna. Auditgränsen är därmed godkänd, inga API-skills behöver aktiveras, och inga tidigare konfigurationer störs.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösningen av TCK-MAINT-024:

**Alternativ 1: Direkt inline-implementation och enkel integrationstestning**
Vi implementerar fallback-adaptrarna direkt i `scripts/run-path.ts` enligt den givna specifikationen. Integrationstestet i `scripts/__tests__/run-path.test.ts` körs genom att anropa `exekveraRunPath` med och utan `--classic`-flaggan direkt i processen, och vi verifierar att stegen loggas till konsolen och att utfallet blir korrekt utan att isolera eller mocka de interna beroendena ytterligare.

**Alternativ 2: Fabriksfunktion för adapter och isolerad I/O-verifiering**
Vi bryter ut skapandet av mock-adaptern till en intern fabriksfunktion i `scripts/run-path.ts`. I integrationstestet använder vi Vitests spionfunktioner (spies) på `io.log` för att bekräfta att rätt StegId extraheras och loggas under exekveringen i classic-läget, vilket ger en mer robust verifiering av att promptkompileringen sker korrekt.

**Alternativ 3: Modulär adapterkonfiguration och end-to-end simulering**
Vi separerar mock-adapterns logik till en egen hjälpexport i `scripts/run-path.ts`. Testsviten utökas här till att inte bara verifiera `success` och `slutfold`, utan även att simulera miljövariabler och argument för att säkerställa att `run-path`-skriptet agerar deterministiskt i en isolerad testmiljö (E2E för CLI-gränssnittet).


#### 2c Att vända om: Resiliensgranskning
Vid en resiliensgranskning står det klart att Alternativ 1 är alltför simpelt och riskerar att dölja felaktig exekvering i tysta loggar. Alternativ 3 är för komplext för detta ändamål och kan leda till en onödigt sammanflätad arkitektur. Alternativ 2 framstår som det mest resilienta valet; att isolera adaptern i en fabriksfunktion och använda spioner för I/O-verifiering garanterar korrekthet och spårbarhet utan att tumma på arkitekturens renhet.


#### 2d Att förlikas: Mättnad
Baserat på resiliensgranskningen står det klart att Alternativ 2 är det mest resilienta valet, då det isolerar adaptern och säkerställer korrekthet. Jag slår därmed fast att Alternativ 2 vinner och deklarerar MÄTTNAD: JA.
