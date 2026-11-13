# BYGGCYKEL LOGG: TCK-057
**Starttid:** 2026-11-13T21:54:49.735Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-057: Exempelskördning av mcp_bridge.legacy.ts och verktygssammanfattning (ADR-030)

**Måldomän:** `mcp_bridge` (`src/features/mcp_bridge/`)
**Målfiler:** `src/features/mcp_bridge/tools/mcpToolRegistryHelper.ts`
**Skördad Legacy:** `src/__tests__/mcp_bridge.legacy.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (konsoliderat till `src/features/mcp_bridge/__tests__/`) verifierar samtliga 3 scenarier från `src/__tests__/mcp_bridge.legacy.ts` (`createStandardMcpServer()` `tools/list`, `McpServer.registerTool` + `tools/call`, samt JSON-RPC `-32601` för okänd metod) plus `summarizeRegisteredTools(server)`, varefter Fas 3 raderar `src/__tests__/mcp_bridge.legacy.ts` och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skapa `src/features/mcp_bridge/tools/mcpToolRegistryHelper.ts` (< 40 rader):**
   - Importera `McpServer` från `../server/mcpServer.ts`.
   - Exportera `summarizeRegisteredTools(server: McpServer): { count: number; names: string[] }` som hämtar `server.getRegisteredTools()` och returnerar `{ count: tools.length, names: tools.map((t) => t.name) }`.
2. **Testdisciplin i Steg 3a (Fail-First + Skörd utan `vi.fn()`):**
   - Läs `src/__tests__/mcp_bridge.legacy.ts` och `src/features/mcp_bridge/server/mcpServer.ts` i Steg 3a.
   - Importera `McpServer`, `createStandardMcpServer` och `summarizeRegisteredTools`.
   - Inga kors-domänimporter och inga `vi.fn()`/`vi.spyOn()`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – MCP-bryggans JSON-RPC-kontrakt blir levande regressionsskydd**
  Givet att `mcp_bridge.legacy.ts` innehåller 3 verifierade JSON-RPC 2.0-tester
  När de skördas in i `src/features/mcp_bridge/__tests__/` tillsammans med `summarizeRegisteredTools`
  Så körs de i varje `pnpm verify` och `mcp_bridge.legacy.ts` städas bort i Fas 3.

**Scenario: ATT VÄNDA OM – Avvisande av trasig JSON-RPC-felhantering**
  Givet att `mcp_bridge` tidigare saknade aktiva enhetstester
  När `-32601` och `tools/call` testas i Vitest
  Så garanteras att MCP-servern svarar deterministiskt.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att testerna passerar och legacy-filen är borttagen
  När `pnpm verify` körs
  Så passerar hela sviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här uppdraget handlar om att städa upp och säkra repot genom att flytta gamla tester till rätt domän. Det ger oss ett mer stabilt och pålitligt system, där JSON-RPC-kontrakten fungerar som ett levande skydd mot framtida problem.


#### 0a Att vända om: Kontraktsaudit
Avsiktsgrinden är bekräftad och vi har förstått den mänskliga nyttan i detta uppdrag. Kontraktsauditen för TCK-057 är nu godkänd och vi går vidare med full systemintegritet.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa TCK-057 och återskapa JSON-RPC-kontraktet:

Alternativ 1: Direkt i-minnet-skördning och single-file helper. Vi flyttar de tre legacyscenarierna direkt till Vitest och skapar en ren funktion för verktygssummering i en enda fil under `tools`.

Alternativ 2: Fabriksbaserad isolering och registry-verifiering. Vi bygger ett testupplägg där vi inspekterar serverns tillstånd före och efter registrering för att säkerställa exakt JSON-RPC-status för $-32601$.

Alternativ 3: Dekopplad registerinspektion med Zod-kontraktsanpassning. Vi säkrar upp att utdatan från summeringen valideras strikt runtime innan testerna konsoliderar resultatet.


#### 2c Att vända om: Resiliensgranskning
Granskningen visar att Alternativ 1 är säkrast. Det minskar risken för buggar genom att hålla koden enkel, direkt och strikt inom domänens gränser, vilket ger ett mer resilient regressionsskydd utan onödig komplexitet.


#### 2d Att förlikas: Mättnad
Alternativ 1 är fastställt som det vinnande alternativet. Dess enkelhet och direkta ansats ger bäst förutsättningar för stabilitet och resiliens, vilket ger ett starkt regressionsskydd. MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Kontraktet är spikat. Vi skapar `src/features/mcp_bridge/tools/mcpToolRegistryHelper.ts` och konsoliderar testet för att säkerställa att JSON-RPC-bryggan har levande regressionsskydd och att arvet från legacy-filen tas till vara på ett säkert och deterministiskt sätt utan syntetiska spioner.
