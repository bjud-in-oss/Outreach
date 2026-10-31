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
  
6. **Självläkande Infrastruktur & Egenanvändning (Dogfooding):**
   - Från manuella terminalingrepp (`node -e`, bash-fixar) till att Byggmotorn autonomt underhåller sina egna orkestreringsskript och konfigurationer via atomära `TCK-MAINT`-biljetter.
   - *Se: ADR-009, ADR-013, ADR-015*

7. **Tvådelad Intentionsbrygga (Funktion vs Systemvård):**
   - Från enkelspåriga funktionsprompter till att Mötesbryggan (`samrad.ts`) skiljer på mänsklig nytta i appen (Gherkin/FSD) och mekanisk rannsakning av motorns verktyg.
   - *Se: ADR-007, ADR-014*
