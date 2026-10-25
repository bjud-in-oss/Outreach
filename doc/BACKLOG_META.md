# FRAMTIDA META-UPPDRAG: EXEKVERBARA SPECIFIKATIONER & MUTATIONSTESTNING

## Kontext & Målbild
När motorns grundläggande stafett (Fas 0–3) är verifierad i skarp drift vill vi höja testkvaliteten från "gröna alibin" till matematiskt bevisad funktion enligt Dave Farleys principer för Continuous Delivery.

## Avgränsade Uppgifter för framtiden:
1. Strikt Kontrakts-DSL i .agents/skills/decomposing-tickets/SKILL.md:
   - Tvinga transienta tester (TCK-) att uteslutande interagera med systemet via externa kontrakt (EventEnvelope, SwarmEventBus eller MCP JSON-RPC).
   - Förbjud inspektion av intern komponentstate, mockning av affärsberäkningar och privata funktioner.
2. Isolerad Mutationstestning (Stryker):
   - Kör stryker.config.json som ett schemalagt nattjobb eller manuellt kommando (pnpm test:mutation) exklusivt mot src/shared/contracts/ och mcp_bridge/contracts/.
   - Stryker ska ALDRIG ligga i den snabba inre loopen (pnpm bygg).
3. Bevisat Fail-First:
   - Verifiera att transienta tester inte bara fallerar rött vid syntaxfel, utan kastar funktionella fel mot systemets domänlöften innan källkod skrivs.