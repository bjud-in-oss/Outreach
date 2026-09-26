# 2b Modellera: Dokumentationsstruktur och Arbetsflöden (TCK-004)

## 1. Dokumentationsmodell för README.md

Strukturen i `README.md` utökas med följande standardsektioner:

```markdown
## 🧭 SI v10.0 Utvecklingsrutiner & Autonom Orkestrering

Samordningsmotorn styrs enligt SI v10.0 och AGENTS.md v10.0 med tvåfasig TDD och strikt Token Gate.

### 1. Att Följa: Planering & Dekomponering
- **Planera hela briefen**: `pnpm planera`
  Läser `PROMPT.md` och dekomponerar automatiskt kraven i enskilda bygg-tickets (1 ticket = 1 FSD-domän) under `doc/TICKETS/`.
- **Planera specifik ticket**: `pnpm planera TCK-XXX`
  Kör ett obrutet Fas 1-svep (1a -> 1b -> 2a -> 2b -> 2e -> 3c) under `doc/LAST_CYCLE/`.

### 2. Att Vända Om: Terminal & Oberoende Validering
- **Arkitektur- och kontraktskontroll**: `pnpm verify`
  Kör oberoende validering av alla Zod-kontrakt, FSD-gränser och genererar ett kryptografiskt verifieringskvitto (`doc/LAST_CYCLE/VERIFY_RECEIPT.json`).
- **Enhetstester**: `pnpm test`
  Kör isolerade TDD-enhetstester i minnet.

### 3. Att Förlikas: Token Gate & Verkställande (Fas 2)
- Vid Steg 3c stannar planeringen. En godkännandekod genereras i `doc/LAST_CYCLE/REQUIRED_TOKEN.txt`.
- Operatören bekräftar i chatten eller kör:
  ```bash
  pnpm genomfor [REQUIRED_TOKEN]
  ```
  Detta låser upp redigering av `src/features/` och initierar transienta mikro-E2E-tester.

### 4. Beslutsstöd via Wayfinder (`/wayfinder`)
- För oklara, komplexa eller strategiska frågeställningar som inte direkt kräver källkodsändring används färdigheten `wayfinder`.
- Aktivera scenariodialogen genom att ställa en öppen strategifråga eller ange `/wayfinder`.
- Wayfinder skapar och underhåller besluts-tickets och kartan över öppna vägval utan att ändra källkod under `src/`.
```

## 2. Kontraktsregler för Skript och Körbarhet
- Samtliga kommandon körs transparent via standardiserad `pnpm`-miljö.
- `package.json` fungerar som kanonisk källa för alla definierade livscykelkommandon.
