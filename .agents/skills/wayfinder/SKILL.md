---
name: wayfinder
description: Use when conducting scenario-based exploratory dialogues, resolving strategic ambiguity, or managing decision tickets without modifying source code.
---

# Wayfinder

## Översikt
Wayfinder är en orienterings- och beslutsfärdighet för att navigera strategisk osäkerhet, analysera scenarier och formulera välgrundade beslut innan källkod förändras.

Enligt **AGENTS.md v10.0** och **SI v10.0** skiljer Wayfinder strikt mellan:
1. **Besluts-tickets:** Scenariofrågor, vägval och strategisk utforskning utan källkodsändringar.
2. **Bygg-tickets:** Konkreta implementationsärenden i `doc/TICKETS.md` bundna till exakt 1 FSD-domän under `src/features/`.

## Användningsområden
- **Fri prompt / Avsaknad av ticket-kod:** När användaren ställer öppna frågor eller kör `pnpm planera` utan specifik `TCK-XXX`.
- **Komplexa vägval (`/wayfinder`):** När systemarkitekturen ställs inför motstridiga krav eller oklara avgränsningar.
- **Skapa klarhet:** Ställ pedagogiska scenariofrågor på svenska, kartlägg konsekvenser och eliminera osäkerhet.

## Output & Artefakter
- Uppdatering av beslutsunderlag eller scenarioskiss i dialogen.
- Registrering av avgränsade bygg-tickets i `doc/TICKETS/TCK-XXX.md` och `doc/TICKETS.md` först när beslutet mognat.
- Rör ALDRIG källkod under `src/` under ett Wayfinder-scenario.
