# 2a Avgränsa: AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet (TCK-013)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-013 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Miljöspärr mot mockar** | AST-kontroll i `scripts/` som förbjuder tysta mockar i `src/features/` samt `HALTED`/`UNAUTHENTICATED`-lägen | Förbud mot mockar i `src/__tests__/` | Transienta tester (< 3s) måste kunna köra med isolerade in-memory-fixturer och testdubblar. |
| **Kapacitetsspärr** | Begränsning till max 3 samtidiga aktiva agenter i `SwarmOrchestrator` | Godtyckligt antal bakgrundsprocesser utan kontroll | Deterministisk exekvering och förutsägbar resursanvändning. |
| **Handoff & Autonomi** | Autonom stegning 1a -> 3c i Bygga-agenten och konsensusgranskning hos Live-agenter vid Token Gate | Helt oövervakad Fas 2-exekvering utan Token Gate | Mänsklig kontroll och produktägarens godkännandekod (Token Gate) vid Steg 3c är absolut obligatorisk. |
| **UI-namnharmonisering** | Dynamisk uppslagning av `unit.displayName` i samtliga vyer | Hårdkodade strängar i individuella komponenter | En enda sanningskälla (`roleDefinitions.ts`) eliminerar begreppsförvirring. |
| **Diagnostikpanel** | Tydlig pedagogisk varning i UI vid saknad nyckel/token | Inmatningsfält för API-nycklar i användargränssnittet | Systemreglerna förbjuder strikt API-nyckelhantering i frontend; Settings > Secrets gäller. |
| **Testsvit** | Transient mikro-E2E `transient_TCK-013.test.ts` (< 3s i minnet) | Långsamma nätverkstester mot externa molnresurser | Snabb återkoppling och deterministisk CI/CD-pipeline. |
| **Token Gate** | Fas 1-stopp vid Steg 3c i väntan på godkännandekod | Ändringar i `src/` under Fas 1 | Rör ingen källkod under `src/` innan `pnpm genomfor [REQUIRED_TOKEN]` körs. |
