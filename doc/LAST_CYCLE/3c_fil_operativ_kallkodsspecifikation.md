# 3c Fil-operativ Källkodsspecifikation (TCK-004)

## 1. Översikt över Förändringskedjan
Följande filer är specificerade för Fas 2 så snart godkännandetoken bekräftats:

---

### Fil 1: `README.md` (MODIFIERING)
- **Syfte**: Uppdatera systemets officiella manual med SI v10.0-rutiner, pnpm-kommandon och Wayfinder-integrering.
- **Specifika ändringar**:
  1. Uppdatera sektionen **Snabbstart** med `pnpm`-kommandon (`pnpm install`, `pnpm planera`, `pnpm genomfor`, `pnpm verify`, `pnpm test`).
  2. Tillföra ny sektion **🧭 SI v10.0 Utvecklingsrutiner & Token Gate** som beskriver:
     - Hur `pnpm planera` och `pnpm planera TCK-XXX` fungerar.
     - Vad Token Gate innebär och hur `doc/LAST_CYCLE/REQUIRED_TOKEN.txt` används för att låsa upp Fas 2.
     - Hur oberoende arkitekturvalidering (`pnpm verify`) säkerställer Zod-kontrakt och systeminvarianter.
  3. Tillföra ny sektion **🧭 Beslutsstöd & Scenariodialoger via Wayfinder (`/wayfinder`)**:
     - Förklara skillnaderna mellan besluts-tickets (Wayfinder, ingen kodpåverkan) och bygg-tickets i `doc/TICKETS.md`.
     - Instruktioner för hur `/wayfinder` används vid komplexa strategiska vägval.

---

### Fil 2: `doc/TICKETS/TCK-004.md` (UPPDATERING I FAS 2)
- **Syfte**: Markera TCK-004 som verifierad med token `WAYFINDER-README-TCK004-TOKEN` vid slutförd Fas 2.

---

### Fil 3: Transienta tester & Verifiering
- **Syfte**: Köra `pnpm verify` för att generera ett uppdaterat arkitekturkvitto i `doc/LAST_CYCLE/VERIFY_RECEIPT.json`.
