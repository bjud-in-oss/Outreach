# 1a Förstå: Wayfinder-installation & README för SI v10.0 (TCK-004)

## 1. Målbild & Bakgrund
I **TCK-004** integrerar vi färdigheten `wayfinder` och uppdaterar systemets dokumentation i `README.md` för att förankra körtidsreglerna och processkontrakten i **SI v10.0** och **AGENTS.md v10.0**.

Tidigare förlitade sig projektet på manuella instruktioner och fragmenterade körkommandon. Genom att etablera:
1. **Wayfinder Skill**: Strategisk kartläggning och hantering av besluts-tickets (AFK/HITL) under `.agents/skills/wayfinder/`.
2. **Standardiserat Körtidsflöde i README.md**: Dokumentera exekveringssekvensen `pnpm planera`, `pnpm planera TCK-XXX`, Token Gate (`REQUIRED_TOKEN.txt`), `pnpm genomfor` samt oberoende arkitekturvalidering (`pnpm verify`).
3. **Koppling till `/wayfinder`**: Instruktioner för hur operatören eller agenten aktiverar scenariodialoger för att skingra dimma utan att röra källkoden.

## 2. Analys av Migrationsmönster & Standardisering
- **Wayfinder i SI v10.0-sammanhang**:
  - Wayfinder används för att särskilja besluts-tickets (Wayfinder scenariofrågor utan kodändring) från bygg-tickets (specifika källkodsändringar under `src/features/`).
  - Kartan (`wayfinder:map`) utgör ett levande index över fattade beslut och öppna vägval.
- **README.md som Operatörskontrakt**:
  - `README.md` måste tydligt förmedla hur utvecklare och agenter interagerar med Outreach Samordningsmotor med de nya `pnpm`-kommandona och Token Gate-spärren.

## 3. Intern Riskanalys (GROW-risknoder)
- **Risknod 1: State (Skill-katalog & Tillstånd i `.agents/skills/`)**
  - *Risk*: Att wayfinder-installationen misslyckas, skriver över existerande skills, eller att relativa sökvägar till skill-definitioner inte hittas under körtid.
  - *Teknisk analys & Åtgärd*: Skillen har framgångsrikt installerats och verifierats under `.agents/skills/wayfinder/SKILL.md`. Inga andra skills har påverkats. JIT-laddning i SI v10.0 slår upp skills lokalt i `.agents/skills/`.
- **Risknod 2: Contract (Wayfinder SKILL.md-kontrakt & CLI-anrop)**
  - *Risk*: Konflikt mellan Wayfinders besluts-tickets och bygg-tickets i `doc/TICKETS.md`.
  - *Teknisk analys & Åtgärd*: AGENTS.md v10.0 Regel 1 separerar strikt besluts-tickets (som hålls i Wayfinder-kartan och inte rör källkod) från bygg-tickets i `doc/TICKETS.md` (som knyts 1-till-1 till en FSD-domän under `src/features/`). Denna princip förtydligas uttryckligen i `README.md`.
- **Risknod 3: Resilience (Feltolerans & Tydlighet vid CLI-anrop)**
  - *Risk*: Användaren försöker köra `pnpm genomfor` utan giltig token eller kör `pnpm planera` och får otydlig feedback.
  - *Teknisk analys & Åtgärd*: Det tvåstegsverifierade skriptet `scripts/run-genomfor.js` läser och validerar `doc/LAST_CYCLE/REQUIRED_TOKEN.txt` med strikt felavbrott. `README.md` förses med en felsökningsguide och instruktioner för hur varje steg i Token Gate fungerar.
