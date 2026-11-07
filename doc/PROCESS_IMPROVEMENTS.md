# Processförbättringar & Systemvård (v10.4)

Detta dokument är motorns aktiva liggare för processlärdomar, identifierad friktion och genomförda systemjusteringar. Varje registrerad processbrist ska leda till en motsvarande `TCK-MAINT`-biljett för att förankras mekaniskt i källkoden eller orkestreringsskripten.

---

## 1. Aktiva Processregler & Erfarenhetsbank
*Här listas regler som upptäckts under byggcykler och som laddas JIT under Fas 0 och Fas 1.*

- **[2026-10-31] Bryt Moment 22 vid infrastrukturfel:** Ändra aldrig orkestreringsskript (`scripts/run-planera-live.ts`) eller drivrutiner via autonoma patch-biljetter om motorns egna verktyg fallerar. Tillämpa deterministisk Git Hard-Reset till senast kända stabila commit.
- **[2026-11-01] Mekanisk förankring:** Introducera aldrig nya statuskoder eller promptval för modellen utan att den mottagande parser- och exekveringslogiken redan är implementerad i skripten.
- **[2026-11-01] Inga råa promptar via Bash CLI:** Skicka aldrig flerradiga promptar, systeminstruktioner eller JSON-data som råa argument i `child_process.execSync`. Skriv alltid till en efemär payload-fil på disk och läs in den i Node för att eliminera `/bin/sh`-syntaxfel.
- **[2026-11-02] TDD Fail-First kräver extern import:** En transient testfil i Fas 1 Steg 3a får aldrig deklarera eller mocka den källkod den avser att testa. Den MÅSTE importera funktioner och typer från den framtida domänen (`../features/[domän]/...`) så att testet bevisat fallerar rött (exit 1) innan källkoden implementeras.
- **[2026-11-02] Rekursiva testvägar och FSD-kataloger:** Alla konsoliderings- och sparmekanismer i orkestreringen måste tillämpa `fs.mkdirSync(path.dirname(p), { recursive: true })` och strikt exkludera `__tests__` från domänens publika `index.ts`.

---

## 2. Historik & Lärdomar från Omvändelseslingan (Meta-Teshuvah)
*Dokumenteras automatiskt av Att förlikas under Fas 3.*
- **[2026-11-02] Hermetiska minnestester utan I/O:** När en funktionell callback, prompter eller beräkning testas i minnet under Fas 1/2, använd rena TypeScript-funktioner (`async () => '...'`) i stället för `vi.fn()`. Det förhindrar falska Gate 3a-larm och eliminerar risken för panikartade kors-importer av händelsebussar från andra domäner.

### Erfarenheter från TCK-035 till TCK-037 (Vägens grundbultar)
- **TDZ i felhanterare:** Variabler som loggar testfel (`testLog`) måste alltid initieras omedelbart vid `catch (err)`-blockets start för att undvika ReferenceError vid omvändelsekrascher.
- **Kontinuerlig barrel-synkronisering:** `index.ts` i FSD-domäner måste uppdateras deterministiskt inför varje testkörning så att nya moduler i underkataloger exponeras direkt.
- **Flerfilskontroll i Fas 2:** Byggmotorn får inte avsluta källkodsgenerering enbart för att en fil sparats (`codeSaved === true`). Alla filer som deklarerats i byggkontraktet måste fysiskt existera på disk innan testningen tillåts starta.
- **Hermetisk TDD utan alibin:** Rena asynkrona mock-funktioner (`async () => ...`) ska användas vid funktionella enhetstester i minnet i stället för `vi.fn()` för att förhindra falska Gate 3a-larm.
- **Platta biljettmallar:** Undvik `---` inuti biljettfiler under `doc/.TICKETS/` för att förhindra att terminalbuffertar klipper heredocs vid inklistring.
