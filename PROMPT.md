# TCK-TEST-001: Verifiera v10.4 Livscykeln

Skapa en minimal "Ping"-funktion under domänen `src/features/telemetry/`.
Funktionen ska sända en `PingEvent` via EventBus när den anropas, och ha ett tillhörande Zod-schema.

Acceptanskriterier:
1. transient_TCK-TEST-001.test.ts MÅSTE innehålla `eventBus.emit` som Körtidsankare (steel-thread).
2. transient_TCK-TEST-001.test.ts MÅSTE falla med exit-kod 1 i Gate 3a innan kod skrivs.
3. Inga korsvisa FSD-importer får ske.
4. pnpm bygg TCK-TEST-001 ska löpa hela vägen till Teatern (Fas 3) utan manuella inbrott.