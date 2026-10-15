# CYCLE LOG: TCK-030b

## Steg 1a
Intention & Mänsklig Nytta: Destruktiv sanering av det gamla spaltade UI-skalet (SplitPaneCanvas, splitPaneHelper) och samling av all historik och verktygsexekvering in i en ren, vertikal Tursfär (TurnContainer). För att förhindra kompilationsfel bryts datastrukturer och typer (AccumulatedTurn, SwarmIntent, etc.) först ut till turnContainerHelper.ts innan gamla vyfiler saneras. Människan befrias från kognitiv spaltyta och ges en sammanhängande samtalsupplevelse i linje med ingressens syfte att eliminera klyftor.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/gemini_live_swarm/ (ui/AppShell.tsx, ui/turnContainerHelper.ts, ui/SplitPaneCanvas.tsx). 2. API-skills: Inga externa API-skills påverkas. 3. Destruktiv sanering: Radering av SplitPaneCanvas.tsx och dess referenser i AppShell.tsx; ersätta spaltat UI med ett rent vertikalt TurnContainer-flöde; radera föråldrade drag- och split-handlers.

## Steg 0b
Vägval & Förlikningsport: Å ena sidan måste vi destruktivt sanera SplitPaneCanvas för att befria gränssnittet från visuell belastning; å andra sidan krävs att alla typdefinitioner (AccumulatedTurn m.fl.) bevaras för att inte bryta appens och testsvitens kompilering. TCK-030b förlikar detta genom att först extrahera alla nödvändiga typer till turnContainerHelper.ts och därefter sanera UI-skalet. human_decision_required: false. Väg 2 (Godkänd för linjärt planeringssvep).

## Steg 1b
Kartlägg Domän & Systemgränser: Källkodsändringar sker inom src/features/gemini_live_swarm/ui/: Skapa turnContainerHelper.ts för AccumulatedTurn, appendStreamChunkToTurns, SwarmIntent och extractTurnEventData; uppdatera TurnContainer.tsx och AppShell.tsx; sanera SplitPaneCanvas.tsx; uppdatera importer i geminiLiveSession.ts, sessionIntentAudio.ts och index.ts; skapa transient test i src/__tests__/transient_TCK-030b.test.ts.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: AppShell.tsx hanterar enbart vertikalt tursfärtillstånd (turns: AccumulatedTurn[]) och prenumererar på swarm.session.text_delta, USER_COMMIT och tool-events för att bygga upp tursfären; all tillståndshantering för delad skärm, dragning och snap-states saneras helt.

## Steg 2b
Modellera Kontrakt: AccumulatedTurn, SwarmIntent, SwarmIntentDef och INTENT_FORCE_MAP modelleras och exporteras från turnContainerHelper.ts.

## Steg 2c
Utvärdera Resiliens & Felhantering: Vid snabb strömning eller tomma deltan hanterar appendStreamChunkToTurns sammanslagning utan dubbletter; AppShell använder flexibel scroll till botten och överlever i bakgrunden utan att kastas vid omritningar; TSX AST-regler (< 125 rader, indrag <= 4, förgreningar <= 5) hålls strikt.

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: Övergången från spaltyta till vertikal tursfär förenklar arkitekturen, minskar kodvolymen och eliminerar layout-buggar. human_decision_required: false.

## Steg 3a
Transient Testspecifikation: Skapa src/__tests__/transient_TCK-030b.test.ts: 90% WAL-verifiering: Verifiera att appendStreamChunkToTurns bygger och slutför turer korrekt med roller, intentioner och timestamp i minnet (< 3s). 10% Browserless/DOM E2E: Verifiera strukturellt att SplitPaneCanvas är raderad och att AppShell renderar TurnContainer rent i ett vertikalt flöde (< 30s).

## Steg 3b
Exakt Källkodsspecifikation: 1. ui/turnContainerHelper.ts: Implementera typer, kartor och hjälpfunktioner för turer och intentioner. 2. ui/AppShell.tsx: Skriv om till ren vertikal tursfär med TurnContainer-ström, SymbolCrown och UnifiedInputBar. Håll under 125 rader. 3. ui/TurnContainer.tsx: Rikta om import av AccumulatedTurn till turnContainerHelper.ts. 4. Radera ui/SplitPaneCanvas.tsx och håll splitPaneHelper.ts kompatibel/sanerad. 5. index.ts: Exportera turnContainerHelper.

## Steg 2e
Operativt Delta (Destruktiv Sanering): Sanera SplitPaneCanvas.tsx permanent. Sanera delade spalt-vyer och drag-reglage i AppShell.tsx. Bevara TurnContainer, UnifiedInputBar och SymbolCrown.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan i STATE.json är intakt. human_decision_required: false. Token genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

