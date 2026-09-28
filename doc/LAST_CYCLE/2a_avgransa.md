# 2a Avgränsa: AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling (TCK-012)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-012 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga domäner (`google_drive_sync`, `wal_logger`, `mcp_bridge`) | TCK-012 fokuserar på gränssnittet, AST-spärrarna och svärmens 4 agenter. |
| **AST-kontroll** | Radantal (<=125 .tsx, <=250 .ts), indenteringsdjup (<=4), förgreningsgrad (<=5) | Extern linters ersättning | Verifieringsskriptet säkrar projektets specifika arkitekturregler snabbt (< 50 ms). |
| **UI-arkitektur** | Greenfield-komponenter under `ui/components/` samt slimmad `SwarmDashboard.tsx` (<100 rader) | Grafiska bibliotek som ökar bundle-storlek i onödan | Atomära komponenter med Tailwind CSS och Lucide-ikoner. |
| **Agentdrift** | Samtliga 4 enheter inklusive "Att tjäna Gud och andra: Bygga" drivs som aktiva agenter i båda arbetssätten | Införande av en 5:e eller fler agenter | Systemets 4 krafter och enheter är fullständiga. |
| **Live API-nyckelbrygga** | Säker anslutningshantering utan UI för API-nycklar | Input-fält för API-nycklar i webbgränssnittet | Systemreglerna förbjuder API-nycklar i användargränssnittet; använd proxyn `/api/*` eller servermiljö. |
| **Tester** | Transienta in-memory tester `transient_TCK-002` och `transient_TCK-012` | Långsamma nätverkstester | Snabb återkoppling under 3 sekunder i minnet. |
| **Token Gate** | Fas 1-stopp vid Steg 3c tills godkännandekod ges | Ändringar i `src/` under Fas 1 | Absolut spärr för att skydda källkodens stabilitet. |
