# Steg 1a: Förstå & Riskanalys (TCK-020)

> *"Ditt högsta syfte är att främja närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas."*

---

## 1. Uppdrag & Kontext (TCK-020)
TCK-020 förenar gränssnittets fysiska och funktionella layout i en adaptiv och intent-styrd helhet:
1. **Intent-Driven Audio & User Gesture**:
   - Webbläsarens strikta `Autoplay Policy` kräver en direkt användargest (`User Gesture`, t.ex. klick) för att instansiera/återuppta `AudioContext` och erhålla mikrofonåtkomst via `navigator.mediaDevices.getUserMedia()`.
   - Lägesknapparna `[ 🎬 Reflektera ]`, `[ 🧠 Kom ihåg ]` och `[ 💬 Rådgör ]` fungerar som direkta intent-triggers som öppnar röstströmmen och kopplar upp sessionen.
   - Klick på en redan aktiv knapp stänger mikrofon/session och publicerar ett dvalatillstånd till `SymbolCrown` med status `"🟡 Agenter i dvala"`.
2. **Integrerade & Adaptiva Lägesknappar på Delningslinjen**:
   - Lägesknapparna flyttas in centralt på själva delningslinjen i `SplitPaneCanvas.tsx`.
   - Vid begränsad bredd kollapsar inaktiva knappar till kompakta, runda ikonknappar, medan den aktiva knappen behåller full text och framhävs (`scale-105`).
3. **Orientering- och Enkelpilsanpassad SplitPane**:
   - Porträttläge: Horisontell delningslinje. Vid botten-snap (0%) döljs nedåtpil och enbart uppåtpil `[ ⇧ ]` visas; vid topp-snap (100%) döljs uppåtpil och enbart `[ ⇩ ]` visas.
   - Landskapsläge: Vertikal delningslinje (vänster/höger) med horisontella pilar `[ ⇐ ]` och `[ ⇒ ]`.
4. **Permanent SymbolCrown & Helskärmskorrigering**:
   - `SymbolCrown` låses permanent till toppzonen och förblir synlig oavsett helskärm eller immersivt tillstånd.
   - Återgång från maximerad chatt (0% eller 100%) återställer split ratio till det balanserade neutralläget (50%) utan klippning eller layoutkrasch.

---

## 2. GROW Intern Riskanalys

### 1. State-Risk (Röstsession, Aktivt Läge & Delningsorientering)
- **Risk**: Växling mellan orienteringar (porträtt/landskap), klick på intent-knappar under pågående röstströmning samt helskärmsväxlingar kan orsaka osynkroniserade tillstånd mellan `AudioContext`, `GeminiLiveSession`, `activeIntent` och `splitRatio`.
- **Lösning**:
  - Definiera ett rent `SwarmIntent`-tillstånd: `'REFLECT' | 'REMEMBER' | 'CONSULT' | null`.
  - Atomär hantering i sessionen: Starta eller stoppa mikrofonen synkront med tillståndsväxling.
  - Spara och återställ föregående `splitRatio` (default 50) vid toggle från helskärm.

### 2. Contract-Risk (Web Audio API, User Gesture & AST-Mått)
- **Risk**: Direkta Web Audio- och MediaDevices-anrop kraschar i Node.js (`npm test`) om de inte skyddas av miljöabstraktion. Samtidigt ställer `scripts/drivers/ts.js` hårda krav på `.tsx`-filer (max 125 rader, djup max 4, max 5 förgreningar).
- **Lösning**:
  - Skydda ljudinitiering bakom webbläsarkontroll (`typeof window !== 'undefined' && window.AudioContext`).
  - Håll `SplitPaneCanvas.tsx` och relaterade komponenter strikt modulära och under 120 rader genom att flytta pilsymboler och layoutlogik till en renodlad hjälpmodul (`splitPaneHelper.ts`).

### 3. Resilience-Risk (Mikrofon-nekad & Hårdvaruresurser)
- **Risk**: Om användaren nekar mikrofontillstånd eller om hårdvaran är upptagen kan appen frysa eller fastna i anslutningsläge.
- **Lösning**:
  - Fånga `NotAllowedError` och nätverksfel säkert, återställ intent-knappen till inaktiv och publicera felbesked till `SymbolCrown`.
  - Garantera att transienta tester i `src/__tests__/transient_TCK-020.test.ts` verifierar både lyckad och avbruten start på under 3 sekunder.

---

## 3. Aktiva Vektorer & Skills
- **active_vectors**: `State` (Intent-växling, split ratio & orientering), `Contract` (User Gesture Audio API & pilscheman), `Resilience` (Mikrofonfrigörelse & permanent SymbolCrown).
- **active_skills**: `gemini-live-api-dev`, `gemini-api-dev`.
