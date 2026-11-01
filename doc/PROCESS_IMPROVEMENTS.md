# Processförbättringar & Systemvård (v10.4)

Detta dokument är motorns aktiva liggare för processlärdomar, identifierad friktion och genomförda systemjusteringar. Varje registrerad processbrist ska leda till en motsvarande `TCK-MAINT`-biljett för att förankras mekaniskt i källkoden eller orkestreringsskripten.

---

## 1. Aktiva Processregler & Erfarenhetsbank
*Här listas regler som upptäckts under byggcykler och som laddas JIT under Fas 0 och Fas 1.*

- **[2026-10-31] Bryt Moment 22 vid infrastrukturfel:** Ändra aldrig orkestreringsskript (`scripts/run-planera-live.ts`) eller drivrutiner via autonoma patch-biljetter om motorns egna verktyg fallerar. Tillämpa deterministisk Git Hard-Reset till senast kända stabila commit.
- **[2026-11-01] Mekanisk förankring:** Introducera aldrig nya statuskoder eller promptval för modellen utan att den mottagande parser- och exekveringslogiken redan är implementerad i skripten.
- **[2026-11-01] Inga råa promptar via Bash CLI:** Skicka aldrig flerradiga promptar, systeminstruktioner eller JSON-data som råa argument i `child_process.execSync`. Skriv alltid till en efemär payload-fil på disk och läs in den i Node för att eliminera `/bin/sh`-syntaxfel.

---

## 2. Historik & Lärdomar från Omvändelseslingan (Meta-Teshuvah)
*Dokumenteras automatiskt av Att förlikas under Fas 3.*
