# 1a Förstå: Standardisering av Domänbeslut (TCK-005)

## 1. Målbild & Bakgrund
I **TCK-005** etablerar vi en standardiserad struktur för arkitekturbeslut (ADR - Architecture Decision Records) över systemets alla moduler enligt **AGENTS.md v10.0** Regel 3:
> "Logga principiella systemövergripande beslut i doc/DECISIONS.md. Domänspecifika arkitekturbeslut dokumenteras lokalt i src/features/[modul]/doc/DECISIONS.md."

### Nulägesanalys
1. **Systemövergripande (`doc/DECISIONS.md`)**:
   - Innehåller ADR-001 (CloudEvents), ADR-002 (SwarmEventBus med Ringbuffert), samt ADR-003 (MasterDevelopmentPlan).
   - Behöver utökas med ADR-004 (Decentraliserad Domändokumentation och ADR-hierarki) och ADR-005 (Fas 1-2 Token Gate & HITL-skydd).
2. **Lokala moduler (`src/features/*/doc/`)**:
   - Ingen av modulerna har en lokal `doc/`-katalog eller lokal `DECISIONS.md`.
   - Domänspecifika arkitektoniska val (t.ex. WAL-loggformat, Gemini Live WebSocket-protokoll, MCP JSON-RPC 2.0-regler, Drive API-tokenhantering) saknar dedikerad dokumentation i modulkatalogen.

## 2. Intern Riskanalys (GROW-risknoder)
- **Risknod 1: State (Placering och versionsstabilitet i modulkatalogerna)**
  - *Risk*: Att skapandet av `src/features/[modul]/doc/` stör modulupplösning, bundler (Vite) eller Typescript-kompilatorn.
  - *Teknisk analys & Åtgärd*: `doc/DECISIONS.md` är rena Markdown-filer som ignoreras av Vite-builden och `tsc --noEmit`. De ligger säkert inom modulgränsen utan importkonflikter.
- **Risknod 2: Contract (Enhetligt ADR-format & Spårbarhet)**
  - *Risk*: Inkonsistenta rubriker eller format mellan moduler gör det svårt att läsa och auditera beslut automatiskt.
  - *Teknisk analys & Åtgärd*: Varje lokal `DECISIONS.md` följer samma strikta standardmall:
    - `Modulbeslut & Domänarkitektur: [Modulnamn]`
    - `ADR-[DOMÄN]-001: [Titel]` med fälten *Datum*, *Status*, *Kontext*, *Beslut*, *Konsekvens*.
- **Risknod 3: Resilience (Token Gate & FSD-integritet)**
  - *Risk*: Prematur skrivning till `src/` under planeringsfasen bryter mot SI v10.0 Token Gate-spärren.
  - *Teknisk analys & Åtgärd*: Inga filer under `src/` modifieras eller skapas under Fas 1. All planering hålls i `doc/LAST_CYCLE/`. Källkodsändringar under `src/features/` låses strikt upp först i Fas 2 via `pnpm genomfor [REQUIRED_TOKEN]`.
