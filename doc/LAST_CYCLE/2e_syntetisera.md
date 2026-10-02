# Steg 2e: Syntetisera & Verifiering av Mättnad (TCK-020)

## 1. Målkonfliktanalys & Syntes

### Målkonflikt 1: Web Audio User Gesture vs Server/Node E2E-Testmiljö
- **Konflikt**: Webbläsarens Autoplay Policy kräver verkliga användargester (`pointerdown`/`click`) för att aktivera `AudioContext` och mikrofon. I Node.js-miljön för transienta minnestester existerar inte dessa globala Web Audio-gränssnitt.
- **Syntes**: `GeminiLiveSession` kapslar in ljudaktiveringen med säker miljödetektering (`typeof window !== 'undefined' && window.AudioContext`). I Node.js utförs tillståndsövergången och händelsedistributionen deterministiskt utan att krascha, medan mikrofonen i webbläsaren kopplas upp skarpt via användarens klick på intent-knapparna.

### Målkonflikt 2: Begränsad Mobil Skärmbredd vs Tre Lägesknappar & Pilar
- **Konflikt**: På smala mobilskärmar (360px–420px) ryms inte tre fulla textknappar tillsammans med två pilsymboler och draghandtag på delningslinjen utan radbrytning eller overflow.
- **Syntes**: Adaptiv knappkollaps via `splitPaneHelper.ts`. Inaktiva knappar krymper till runda, eleganta ikonknappar (`🎬`, `🧠`, `💬`) med texten dold på små skärmar (`hidden sm:inline`). Enbart den aktiva knappen expanderas med full text och förhöjs med `scale-105 shadow-md`.

### Målkonflikt 3: Helskärmschatt vs Permanent Symbol-Krona
- **Konflikt**: Tidigare lösning dolde Symbol-Kronan vid immersivt helskärmsläge, vilket berövade användaren insyn i aktuell kraft och aktivitet.
- **Syntes**: `SymbolCrown` förankras permanent i den översta zonen i `AppShell.tsx`. Delningslinjens gränslägen (0% och 100%) anpassar enbart ytfördelningen mellan övre kanvas och undre chatt, medan kronan alltid förblir intakt och klickbar. Enkelpilarna indikerar entydigt vägen tillbaka till 50% neutralläge.

---

## 2. Kriterier för Mättnad
- Samtliga mål från TCK-020 är fullständigt adresserade i arkitekturskissen.
- Inga regressioner i befintliga 103 tester.
- AST-begränsningar för alla `.tsx`-komponenter garanteras genom hjälparstrukturen i `splitPaneHelper.ts`.

MÄTTNAD: JA
