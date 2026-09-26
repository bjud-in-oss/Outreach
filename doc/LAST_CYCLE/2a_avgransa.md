# 2a Avgränsa: Mål, Omfång och Invarianter (TCK-004)

## 1. Målavgränsning & Leveransomfång
Ticket **TCK-004: Wayfinder-installation & README för SI v10.0** syftar till att formellt förankra de nya process- och exekveringsrutinerna i Outreach Samordningsmotor.

### Ingår i omfånget (IN-SCOPE):
1. **Wayfinder Skill**:
   - Bekräftelse och verifiering av Matt Pococks `wayfinder` skill under `.agents/skills/wayfinder/`.
2. **README.md Uppdatering**:
   - Introducera en tydlig sektion för **SI v10.0 Utvecklingsrutiner & Token Gate**.
   - Dokumentera kommandona `pnpm planera`, `pnpm planera TCK-XXX`, `pnpm genomfor [TOKEN]`, `pnpm verify` och `pnpm test`.
   - Dokumentera flödet för `/wayfinder` (hur man initierar en besluts-ticket för att skingra dimma utan kodändring).
   - Beskriva hur besluts-tickets i Wayfinder skiljer sig från bygg-tickets i `doc/TICKETS.md`.
3. **Bevara Befintlig Struktur**:
   - Behålla det personliga brevet och arkitekturöversikten intakt som ett pedagogiskt fundament.

### Ingår EJ i omfånget (OUT-OF-SCOPE):
- Källkodsändringar under `src/features/` (hanteras i TCK-006 och TCK-007).
- Skapande av lokala `DECISIONS.md` under `src/features/[modul]/doc/` (tillhör TCK-005).
- Ändringar i datamodeller eller Zod-kontrakt.

## 2. Invarianta Arkitekturprinciper
- **Noll Källkodspåverkan i Fas 1**: Inga filer under `src/` ändras eller skapas.
- **Transparens**: Dokumentationen ska ge utvecklaren och operatören exakt förståelse för varför ett Fas 1-svep stannar vid Steg 3c och hur källkoden skyddas fram till `pnpm genomfor`.
