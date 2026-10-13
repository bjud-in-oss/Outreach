# CYCLE LOG: TCK-029

## Steg 1a
Intention & Mänsklig Nytta: Implementera en empati-driven WAL-diagnostik och cirkulär mätbuffert i RAM som ett led i att främja närhet och omsorg för människan. Teknisk telemetri underordnas försoningsmotorns tre vägar: att visa tålamod vid mänsklig tvekan (hålla 2 perspektiv varma) och ödmjukhet att släppa bagage (vända om). Bufferten rymmer exakt de 5 senaste avgörande interaktionerna och 3 sekunder PCM-ljud. Vid användarens ånger och tidsresa ([ ↩ Restore ]) töms bufferten skoningslöst för att ge människan en ren, förlåtande nystart utan gammal stress eller släpande ljud.

## Steg 0a
Kontraktsaudit: 1. Max 1 FSD-domän: src/features/wal_logger/ (engine/, contracts/, replay/, samt ny walUiTelemetry.ts). 2. API-skills: SwarmEventBus CloudEvents och WAL-scheman. 3. Saneringskrav: Destruktiv sanering av obegränsad minnesallokering och ackumulering av telemetri; strikt minnesgräns på max 5 poster och max 1 MB RAM; säkerställa att [ ↩ Restore ] spolar all ackumulerad transient historik utan att lämna spökdata.

## Steg 0b
Vägval & Förlikningsport: Å ena sidan krävs rik diagnostik och felsökningsunderlag vid krascher; å andra sidan får telemetri och loggning aldrig skapa kognitiv eller prestandamässig friktion för användaren. TCK-029 håller båda perspektiven varma genom en strikt cirkulär FIFO-ringbuffert (max 5 händelser) som är transient i RAM och som spolas vid försoning/restore. Ärendet isoleras helt inom src/features/wal_logger/ utan otillåtna korsberoenden. Inga API-brott föreligger. Väg 2 (Godkänd för linjärt planeringssvep). human_decision_required: false.

## Steg 1b
Kartlägg Domän & Systemgränser: Källkodsändringar isoleras till src/features/wal_logger/: Skapa engine/transientRingBuffer.ts för cirkulär lagring av max 5 händelser och PCM-referenser, skapa walUiTelemetry.ts för SwarmEventBus-lyssning (UI_STATE_CHANGED, MUTEX_TOGGLED, SESSION_CONFIG_UPDATED, swarm.session.text_delta) och flush vid Restore, uppdatera contracts/walSchema.ts och index.ts, samt skapa transient test i src/__tests__/transient_TCK-029.test.ts.

## Steg 2a
Avgränsa Tillstånd & Biverkningar: Hantera diagnostikbuffertens tillstånd och gränser: 1. Buffertkapacitet: Exakt 5 diagnostikposter (FIFO). Vid post #6 skrivs äldsta över automatiskt. 2. Minnesbudget: Max 1 MB RAM för att eliminera risk för minnesläckor eller trögt UI. 3. Händelselyssnare: Fångar specifika händelser från SwarmEventBus (pendelsvängningar, mute-toggles, reflektionsval och text-deltan). 4. Empatisk Buffer Flush: Vid event swarm.session.restore, wal.buffer.flush eller explicit restore-anrop nollställs bufferten omedelbart till 0 poster. 5. Crash Dump Export: Metod för att exportera buffertens snapshot vid krasch för E2E/BDD-granskning.

## Steg 2b
Modellera Kontrakt: Definiera TransientDiagnosticEntrySchema i contracts/walSchema.ts med id (string), type (string), timestamp (string), data (z.record(z.any())), pcmBufferDurationMs (z.number().default(3000)), samt TransientRingBufferMetricsSchema med capacity (number.max(5)), currentCount (number.max(5)), isFlushed (boolean), och lastEventTime (string).

## Steg 2c
Utvärdera Resiliens & Felhantering: FIFO-överskrivning garanterar att minnet aldrig växer bortom 5 element, även under intensiva röstsessioner med hundratals transkript. Vid ångra/restore garanterar synkron flush att inga gamla PCM-chunkiar eller stressade telemetrivärden återspelas. Zod safeParse skyddar mot felformaterade händelser på eventbussen (Fail Fast). Modulär implementation med < 125 rader per delkomponent.

## Steg 2d
Syntetisk Vägvägning & Mognadskontroll: De 3 scenarierna i TCK-029 harmoniserar direkt med befintlig WAL- och SwarmEventBus-arkitektur. Kraven kan implementeras med noll arkitekturskuld och full bakåtkompatibilitet. human_decision_required: false.

## Steg 3a
Transient Testspecifikation: Skapa src/__tests__/transient_TCK-029.test.ts som verifierar de 3 BDD-scenarierna via WAL-replay: Scenario 1 (Tålamod vid osäkerhet): Skicka fler än 5 stress-events (t.ex. 8 mute/unmute och partiella deltan); verifiera att bufferten rymmer exakt 5 händelser och att pendeln förblir stabil i LISTEN. Scenario 2 (Ren start vid försoning): Fyll bufferten med 5 händelser, trigga restore/flush; verifiera att bufferten omedelbart nollställs till 0 händelser. Scenario 3 (Aktivt lyssnande på hjälpbehov): Skicka SESSION_CONFIG_UPDATED med djup reflektion; verifiera att bufferten fångar signalen deterministiskt. Testet exekverar på under 3 sekunder i Node/RAM.

## Steg 3b
Exakt Källkodsspecifikation under src/features/wal_logger/: 1. engine/transientRingBuffer.ts: Skapa TransientRingBuffer-klass med push(entry), flush(), getEntries(), snapshot(), och max 5 kapacitet. 2. walUiTelemetry.ts: Skapa WalUiTelemetryListener som prenumererar på SwarmEventBus, lyssnar på UI_STATE_CHANGED, MUTEX_TOGGLED, SESSION_CONFIG_UPDATED, swarm.session.text_delta och spolar vid Restore. 3. contracts/walSchema.ts: Exportera scheman för TransientDiagnosticEntry. 4. index.ts: Exportera TransientRingBuffer och WalUiTelemetryListener.

## Steg 2e
Operativt Delta (Destruktiv Sanering): 1. Radera obegränsad telemetrilagring och ersätt med strikt 5-elements cirkulär buffert. 2. Sanera avsaknad av flush vid restore så att gammalt ljudbagage aldrig kan överleva en återställning. 3. Behålla WalEngine och WalReplayer orörda för full kompatibilitet.

## Steg 3c
Slutgiltigt Byggkontrakt: Samtliga steg i Fas 1 är fullbordade och HMAC-kedjan i STATE.json är intakt. human_decision_required: false. Token genereras i doc/LAST_CYCLE/REQUIRED_TOKEN.txt.

