# TCK-MAINT-041: WS 1011-omsändning i BidiLiveSession och Universal Fas 2-filkontroll

**Måldomän:** `scripts` (`scripts/bidiLiveRunner.ts`, `scripts/run-planera-live.ts`)
**Mekanisk Acceptans:** Ett transient skripttest bevisar att:
1. `BidiLiveSession` i `scripts/bidiLiveRunner.ts` sparar `pendingText` under `send()`, inväntar aktiv session via `waitForSession()`, skickar om `pendingText` automatiskt vid `WS 1011`/`1006`-återanslutning när `currentResolver` är aktiv, samt rensar `reconnectTimer` i `close()`.
2. `isFas2Complete()` i `scripts/run-planera-live.ts` kontrollerar `required.every(f => modifiedFiles.includes(f))` för BÅDE `isMaint` och ordinarie funktionsbiljetter (`!isMaint`), och `getFas2FollowupPrompt()` listar opatchade målfiler.
Samtliga skripttester, domäntester och FSD-kontroller passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Omsändning vid `WS 1011`/`1006` och timerstädning i `scripts/bidiLiveRunner.ts`:**
   - Lägg till fälten `private pendingText: string | null = null;` och `private reconnectTimer: any = null;` i `BidiLiveSession`.
   - I `send(text, timeoutMs = 120000)`: sätt `this.pendingText = text;` vid start och nollställ `this.pendingText = null;` i timeout-handlern, `currentResolver` och `currentRejecter`.
   - Anropa `const activeSession = await this.waitForSession();` innan `activeSession.sendClientContent(...)` exekveras.
   - I `onclose` vid `code === 1011 || code === 1006`: om `!this.currentResolver`, avbryt återanslutningen direkt. Annars lagra timer i `this.reconnectTimer = setTimeout(async () => { ... }, delay)` och när `await this.connect()` slutförts och `this.pendingText && this.session && !this.isClosed` gäller, anropa `this.session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: this.pendingText }] }], turnComplete: true })`.
   - I `close()`: rensa `if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }` och sätt `this.pendingText = null;`.
2. **Universal Fas 2-filkontroll i `scripts/run-planera-live.ts`:**
   - I `isFas2Complete()`: ta bort `if (isMaint)`-förgreningen och returnera:
     `const required = getRequiredFiles(); const missing = getMissingFiles(); return missing.length === 0 && required.every(f => modifiedFiles.includes(f));`
   - I `getFas2FollowupPrompt()`: efter kontrollen av `missing.length > 0`, kontrollera `const untouched = getRequiredFiles().filter(f => !modifiedFiles.includes(f));` och om `untouched.length > 0`, returnera en uppmaning som listar `untouched` och kräver `apply_patch` på dessa filer.
3. **Bevara FSD- och skriptinvarianter:**
   - Ändringarna berör uteslutande `scripts/bidiLiveRunner.ts` och `scripts/run-planera-live.ts`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Oavbrutet byggflöde genom serveravbrott och flerfilsuppdateringar**
  Givet att ett uppdrag skickas över Bidi Live WebSocket eller omfattar både ny och befintlig källkod
  När `WS 1011` inträffar eller en första fil sparas i Fas 2
  Så ska `BidiLiveSession` återuppta sändningen direkt och `isFas2Complete` hålla kanalen öppen tills samtliga målfiler uppdaterats
  Och bygget slutförs utan hängning.

**Scenario: ATT VÄNDA OM – Avvisande av övergivna timers och ofullständiga Fas 2-avslut**
  Givet att `close()` anropas eller att en målfil i `getRequiredFiles()` ännu inte ligger i `modifiedFiles`
  När livscykeln utvärderas
  Så ska timers städas omedelbart och mikrokanalen tvingas slutföra återstående patchar
  Så att inga halvfärdiga ändringar når testgrinden.

**Scenario: ATT FÖRLIKAS – En helgjuten byggmotor inför TCK-051**
  Givet att `scripts/bidiLiveRunner.ts` och `scripts/run-planera-live.ts` är uppdaterade
  När `pnpm verify` körs
  Så passerar samtliga skript- och domäntester med exit 0.
