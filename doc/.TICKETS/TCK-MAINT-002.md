# TCK-MAINT-002: Tätning av WebSocket-livscykel i bidiLiveRunner

## MÅL
Åtgärda ett asynkront nätverksfel i `scripts/bidiLiveRunner.ts` som orsakas av eftersläpande meddelanden från stängda WebSockets. 

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/bidiLiveRunner.ts` runt rad 60-65 (lyssnaren för `onmessage: async (msg: any) => {`).
2. Använd `apply_patch` för att lägga till raden `if (this.isClosed) return;` direkt innanför blocket för `onmessage`.

Detta säkerställer att processen inte kraschar om Google Live API skickar data precis efter att vi anropat `runner.close()`.

*Observera: Du behöver inte skriva något transient test för denna infrastrukturändring. Gå direkt till patchning.*
