# CYCLE LOG: TCK-032

## Steg 1a
Användarens upplevelse i samtalsvyn kräver absolut transparens och lugn. När användaren skickar ett textmeddelande i prompt-baren skapar en dubbelrendering kognitiv friktion och känsla av systeminstabilitet. Genom att etablera en strikt idempotent inmatning via en auktoritativ ström, ta emot skrivna svar (part.text) från Gemini Live-modellen och binda mikrofonens intent korrekt till CONSULT ('Att förlikas'), helas klyftan mellan människan och motorn så att samtalet flyter naturligt.

## Steg 0a
Kontroll mot FSD- och API-krav: Ändringarna är strikt begränsade till en enda domän, src/features/gemini_live_swarm/. Inga cross-domain importer tillåts. SwarmIntent-kontraktet (CONSULT | REFLECT | REMEMBER) ska respekteras exakt utan typkonvertering eller magiska strängar som forlikas. Destruktiv sanering kräver att den redundanta swarm.session.text_delta-händelsen i handleSend tas bort till förmån för sendRealtimeText.

## Steg 0b
Vägvägning: Å ena sidan kunde man tillåta att prompt-baren både skickar lokalt eko och live-text för snabb lokal feedback, men å andra sidan leder detta ofrånkomligen till kapplöpningstillstånd och duplicerade pratbubblor i TurnContainer. Vi väljer därför entydigt väg 2: En enda auktoritativ textström från sendRealtimeText, kombinerat med idempotensskydd i appendStreamChunkToTurns. Bygget godkänns för linjärt svep utan mänskligt avbrott.

## Steg 1b
Domängränsanalys: Berörda moduler är promptBarHelper.ts, turnContainerHelper.ts, geminiLiveSession.ts, samt AppShell.tsx inom src/features/gemini_live_swarm/. sendRealtimeText publicerar swarm.live.stream.text som konsumeras av extractTurnEventData och ackumuleras i AppShell. Inkommande part.text från Gemini WebSocket extraheras i handleAgentMessage och emitteras till tursfären.

## Steg 2a
Tillståndsgranskning: usePromptBarState hanterar inputText, isLiveActive, isMuted, isSTTActive. Biverkningar: handleSend rensar inputText och anropar sendRealtimeText. handleMicToggle togglar mute-tillstånd eller aktiverar Live-sessionen med CONSULT. appendStreamChunkToTurns i turnContainerHelper.ts hanterar idempotens genom att jämföra clientMessageId och undvika duplicerad konkatenering vid snabba omsändningar.

## Steg 2b
Kontraktsmodellering: SwarmIntent är en sluten union typad som 'REFLECT' | 'REMEMBER' | 'CONSULT'. extractTurnEventData utökas med clientMessageId?: string. AccumulatedTurn inkluderar fältet clientMessageId?: string. LiveStreamChunk fortsätter att valideras via Zod (LiveStreamChunkSchema), och part.text payload valideras som icke-tom sträng innan den skickas som swarm.session.text_delta.

## Steg 2c
Resiliensanalys: Vid nätverkslatens eller paketdubblering kan WebSocket och lokal händelsebuss skicka identiska textbitar. Om appendStreamChunkToTurns mottar samma clientMessageId med redan existerande text ska anropet vara en ren no-op. Om part.text saknas eller är tom ignoreras den utan att avbryta PCM-ljudavkodningen i samma meddelandepaket.

## Steg 2d
Mognadskontroll: Källkodsskulden i geminiLiveSession.ts måste bevakas noggrant; filen har 248 rader och gränsen är 250 rader. Ny textlyssning i handleAgentMessage måste implementeras med maximal koncishet (en rad eller kompakt block) så att radgränsen inte överskrids. promptBarHelper.ts rensas från överflödiga emits vilket minskar dess komplexitet.

## Steg 3a
Transient Testspecifikation (90/10): src/__tests__/transient_TCK-032.test.ts planeras med tre BDD-scenarier. Scenario 1 (Negativ/Idempotens): Multipla identiska text-händelser med samma clientMessageId matas till appendStreamChunkToTurns, vilket ska resultera i exakt en enda post utan dubblerad text (< 3s WAL replay). Scenario 2: handleAgentMessage med part.text emitterar korrekt formaterat text_delta för assistenten. Scenario 3: handleMicToggle anropar activateIntent('CONSULT') utan typfel.

## Steg 3b
Exakta ändringar:
1. src/features/gemini_live_swarm/ui/promptBarHelper.ts: Ta bort emit av swarm.session.text_delta i handleSend. Ändra 'forlikas' till 'CONSULT' i handleMicToggle.
2. src/features/gemini_live_swarm/ui/turnContainerHelper.ts: Lägg till clientMessageId i AccumulatedTurn, extractTurnEventData och implementera idempotenskontroll i appendStreamChunkToTurns.
3. src/features/gemini_live_swarm/session/geminiLiveSession.ts: I handleAgentMessage, lägg till hantering av part.text som emitterar swarm.session.text_delta för assistenten, med bibehållen radgräns (< 250 rader).
4. src/features/gemini_live_swarm/index.ts: Verifiera barrel exports.

## Steg 2e
Operativt Delta (Bevara vs Sanera destruktivt):
- Bevara: Alla existerande Zod-scheman, telemetrilogik, audio playback och WAL-återställning.
- Sanera destruktivt: Ta bort redundant swarm.session.text_delta från handleSend i promptBarHelper.ts. Ersätt den felaktiga strängen 'forlikas' med 'CONSULT'. Sanera duplicerad tilläggslogik i turnContainerHelper.ts.

## Steg 3c
Slutgiltigt byggkontrakt: Alla kontrakt är validerade, FSD-gränsen är isolerad till gemini_live_swarm, AST-mått är under strikt kontroll. Inga mänskliga frågor krävs (human_decision_required: false). Fas 1 avslutas och Fas 2 låses upp med REQUIRED_TOKEN via node scripts/run-bygg.js TCK-032.
