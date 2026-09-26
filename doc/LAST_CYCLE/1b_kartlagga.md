# 1b Kartlägga: Filstrukturer, Gränsytor och Dokumentation (TCK-004)

## 1. Kartläggning av Befintlig Kodbas och Beröringspunkter
1. **Färdighetskatalog (`.agents/skills/`)**:
   - `wayfinder`: Installerades under `.agents/skills/wayfinder/SKILL.md`.
   - `decomposing-tickets`: Etablerades under `.agents/skills/decomposing-tickets/SKILL.md`.
2. **Systemdokumentation (`README.md`)**:
   - Befintligt innehåll: Filosofiskt personligt brev, arkitekturöversikt över de fyra grundmodulerna (`google_drive_sync`, `wal_logger`, `mcp_bridge`, `gemini_live_swarm`), grundläggande installationsanvisningar med `npm`.
   - Brister i nuläget: Saknar instruktioner för SI v10.0: `pnpm planera`, `pnpm genomfor`, Token Gate (`REQUIRED_TOKEN.txt`), `pnpm verify` samt `/wayfinder`-scenariodialoger.
3. **Körtidsskript (`scripts/` & `package.json`)**:
   - `package.json` har skripten `planera`, `genomfor`, `verify`, `test`.
   - `scripts/run-planera.js` hanterar både fri dekomponering och Fas 1-initiering.
   - `scripts/run-genomfor.js` skyddar `src/` och kräver kryptografisk token-matchning.

## 2. Intern Riskanalys (Uppföljning och Fördjupning)
- **Risknod 1: State (Versionskoherens mellan README och skript)**
  - *Svar*: Samtliga kommandoexempel i `README.md` speglar de exakta fälten i `package.json` och den standardiserade `pnpm`-miljön.
- **Risknod 2: Contract (Token Gate-integritet)**
  - *Svar*: Dokumentationen beskriver exakt hur `REQUIRED_TOKEN.txt` skapas vid Steg 3c, kontrolleras i chatten och verifieras av `pnpm genomfor [TOKEN]`.
- **Risknod 3: Resilience (Inga oavsiktliga källkodsändringar)**
  - *Svar*: TCK-004 rör uteslutande dokumentation och skill-infrastruktur (`Global`), vilket lämnar `src/` helt opåverkad.

## 3. Planerade Filoperationer
| Fil | Typ | Syfte |
|---|---|---|
| `.agents/skills/wayfinder/SKILL.md` | Befintlig / Verifierad | Bekräfta fullständig Wayfinder-specifikation |
| `README.md` | Modifiering | Tillföra SI v10.0-rutiner, pnpm-arbetsflöden och /wayfinder-sektion |
| `doc/TICKETS.md` | Uppföljning | Markera TCK-004 i förberedelse för Fas 2 |

```json
{
  "status": "PLANNING_FAS_1",
  "current_domain": "Global",
  "next_step": "2a_avgransa",
  "ticket_id": "TCK-004",
  "active_skill": "wayfinder",
  "active_vectors": [
    "wayfinder_integration",
    "si_v10_runtime_contracts",
    "readme_standardization",
    "pnpm_workflow"
  ]
}
```
