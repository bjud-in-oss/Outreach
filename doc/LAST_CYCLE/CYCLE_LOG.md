# BYGGCYKEL LOGG: TCK-MAINT-033
**Starttid:** 2026-11-11T21:19:45.202Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-033: Aktivera Tailwind i Vite, Harmonisera SwarmEventBus och Montera A2UI i App

**Måldomän:** `scripts` & `src/shared/bus/` & rotfiler (`vite.config.ts`, `src/App.tsx`)
**Mekanisk Acceptans:** Ett transient test eller lokal verifiering bevisar att `vite.config.ts` inkluderar Tailwind-pluginet, att `src/shared/bus/swarmEventBus.ts` implementerar `publishLiveEvent` och `publishSerialMetric`, samt att `src/App.tsx` komponerar `RenderA2UI` och `AppShell` utan att regressionssviten eller FSD-granskningen fallerar (exit 0).

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Aktivera Tailwind v4 i Vite:**
   - I `vite.config.ts` MÅSTE `@tailwindcss/vite` importeras och läggas till i `plugins: [react(), tailwindcss()]`.
2. **Metodharmonisering i SwarmEventBus:**
   - I `src/shared/bus/swarmEventBus.ts` MÅSTE `SwarmEventBus` kompletteras med:
     * `publishLiveEvent(type: SwarmEventType, payload: any): void` som delegerar till `this.emit(type, payload)`.
     * `publishSerialMetric(metric: any): void` som delegerar till `this.emit('swarm.serial.metric', metric)`.
3. **A2UI-komposition i App:**
   - I `src/App.tsx` MÅSTE `RenderA2UI` från `src/features/a2ui/` importeras och monteras i layouten tillsammans med `AppShell` under `SwarmProvider`.
   - Befintlig FSD-isolering förblir intakt (App.tsx äger kompositionen mellan a2ui och gemini_live_swarm).

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Gränssnittet kläs i färg och form**
  Givet att Vite startas mot webbläsaren
  När `vite.config.ts` laddar Tailwind-pluginet och `src/App.tsx` renderar A2UI-korten
  Så ska stilmallen appliceras korrekt med mörk bakgrund och formgivna kort
  Och människan möts av en lugn och inbjudande visuell rymd.

**Scenario: ATT VÄNDA OM – Händelsebussen skyddar mot körtidskrasch**
  Givet att `GeminiLiveSession` anropar `publishLiveEvent` vid start
  När händelsen skickas till bussen
  Så ska metoden finnas tillgänglig och vidarebefordra händelsen utan undantag
  Och webbläsaren drabbas inte av vita skärmar eller metodfel.

**Scenario: ATT FÖRLIKAS – Autonom integration fullbordas**
  Givet att alla tre filerna uppdateras autonomt av Byggmotorn
  När `pnpm verify` körs
  Så ska samtliga enhetstester, skriptkontroller och arkitekturregler lysa 100 % gröna
  Och systemet är redo för skarp körning via `pnpm dev`.

```


#### 1a Att följa: Intention & Nytta
Jag förstår intentionen med det här uppdraget. Ni vill klä gränssnittet i en lugn och inbjudande visuell form, samtidigt som vi stärker systemets inre stabilitet så att alla delar harmonierar perfekt. Det känns som en vacker och stabil grund. Stämmer det överens med er vision för systemet?


#### 0a Att vända om: Kontraktsaudit
Kontraktsauditen är utförd och gränserna är validerade. Vi säkerställer strikt isolering och att händelsebussen och roten förblir intakta genom bygget. STATUS: GÖTKÄNT.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-033 föreslår jag tre ortogonala alternativ.

Alternativ ett innebär direkt patching och sammanslagning i ett linjärt svep: vi uppdaterar Vite, SwarmEventBus och App.tsx i ett svep och verifierar med ett gemensamt integrationstest.

Alternativ två fokuserar på isolation genom att hålla SwarmEventBus intakt och istället expandera med en proxy-modul, samt separera A2UI-kompositionen med villkorlig rendering.

Alternativ tre är en inkrementell fasad utveckling där vi först testar Vites Tailwind-stöd, därefter utökar händelsebussen med enhetsverifiering innan vi slutför monteringen i App.tsx.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett är effektivt vid snabba ändringar, men innebär en risk för körtidskrascher eftersom brister i händelsebussen inte upptäcks förrän i ett sent skede.

Alternativ två ökar isoleringen genom proxyn, men introducerar komplexitet som kan dölja latenta fel och strida mot vår princip om ren struktur.

Alternativ tre är mest resilient; genom inkrementell utveckling och omedelbar verifiering kan vi säkerställa att varje fas är stabil innan nästa påbörjas, vilket minimerar kraschrisken.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning står det klart att alternativ tre är det vinnande kontraktet. Det ger oss den resiliens och stabilitet vi behöver genom inkrementell utveckling och omedelbar verifiering. MÄTTNAD: JA.
