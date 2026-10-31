# PARADIGM SHIFTS (Outreach Coordination Engine v10.4)

Detta dokument beskriver motorns grundläggande doktriner och mentala modeller.
För detaljerade tekniska kontrakt, Zod-scheman och implementeringsdetaljer, se:
- Övergripande systembeslut: doc/DECISIONS.md
- Domänbeslut: src/features/[domän]/doc/DECISIONS.md

---

## Översikt över Paradigmskiften

1. **Decentraliserad Händelsestyrning:**
   - Från monolit till isolerade FSD-öar sammanbundna via CloudEvents.
   - *Se: ADR-001, ADR-004, ADR-WAL-001*

2. **Värdledd Röstinteraktion:**
   - Från kaotiska parallella sockets till en enskild Host-agent med VAD turn-completion och spatial bakgrundssyntes.
   - *Se: ADR-SWARM-020, ADR-SWARM-022, ADR-SWARM-024*

3. **Noll Compliance Theater:**
   - Från mock-alibin och tysta fallbacks till Fail-First, körtidsankare (Steel Thread) och förbud mot källkodsassertions.
   - *Se: ADR-006, ADR-007, ADR-SWARM-011*

4. **Isomorf AST-arkitektur:**
   - Från externa OS-binärer (ast-grep, dep-cruiser) till universell portabilitet via TypeScripts inbyggda Compiler API.
   - *Resultat: Noll externa verktygsberoenden, 100 % webbläsarkompatibel analys.*

5. **Mänsklig Suveränitet & Kognitiv Separering:**
   - Från binära token-spärrar till interaktiv beslutsgrind med frågeloop och spec-sparande (`s`).
   - *Resultat: Tankearbete bevaras utan att källkod muteras förhastat.*

6. **Kirurgisk Källkodspatchning & Amputationsspärr:**
   - *Från:* Helkällkods-generering där agenten skriver om hela filen från grunden vid minsta ändring via `save_code`. Detta ledde till katastrofal kodamputation – befintliga funktioner, imports och hooks försvann så fort filer växte.
   - *Till:* Kirurgisk search & replace (O(N) patchning) via `apply_patch` och deterministisk strängmatchning (`patchMutator.js`). Modellen muterar enbart det specifika blocket och skyddas av en mekanisk amputationsspärr som avvisar om en fil krymper drastiskt (>60%).
   - *Konsekvens:* Stora och komplexa moduler kan byggas ut inkrementellt utan att historisk kod raderas.
   - *Se: ADR-017*

7. **AI-Tolerant Infrastruktur (Symmetrisk I/O för Autonom TDD):**
   - *Från:* Infrastrukturen döljer komplexitet (t.ex. CloudEvents-kuvert) som utvecklare förväntas kompensera för manuellt. Detta skapar ett "Context Gap" för autonoma agenter och omöjliggör TDD-självrättning (agenten tror källkoden är trasig när det i själva verket är infrastrukturen som muterat formatet).
   - *Till:* Infrastrukturen är symmetrisk och transparent. Det en agent skickar in (`emit(A)`) är EXAKT vad testet tar emot (`subscribe(A)`).
   - *Konsekvens:* Autonom TDD fungerar på riktigt. När ett test fallerar vet agenten att det uteslutande beror på dess egen logik, vilket möjliggör deterministisk självrättning utan hallucinationer.
   - *Se: ADR-002, ADR-018*

8. **Självläkande Infrastruktur & Egenanvändning (Dogfooding):**
   - Från manuella terminalingrepp (`node -e`, bash-fixar) till att Byggmotorn autonomt underhåller sina egna orkestreringsskript och konfigurationer via atomära `TCK-MAINT`-biljetter.
   - *Se: ADR-009, ADR-013, ADR-015*

9. **Tvådelad Intentionsbrygga (Funktion vs Systemvård):**
   - Från enkelspåriga funktionsprompter till att Mötesbryggan (`samrad.ts`) skiljer på mänsklig nytta i appen (Gherkin/FSD) och mekanisk rannsakning av motorns egna verktyg.
   - *Se: ADR-007, ADR-014*