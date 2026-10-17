# TCK-TEST-001: Verifiera v10.4 Livscykeln

## 🎯 Intention & Nytta
Verifiera Outreach Coordination Engines v10.4 livscykel deterministiskt från Fas 0 till Fas 3 Teatern.
Skapa en minimal, robust "Ping"-funktion under FSD-domänen `src/features/telemetry/`.
Funktionen sänder en typad `PingEvent` via EventBus när den anropas och valideras med ett tillhörande Zod-schema.

## 🏛️ Domängränser (FSD)
- Domän: `src/features/telemetry/`
- Tillåtna externa importer: Enbart `src/shared/` och externa paket (`zod`). Inga korsvisa feature-importer.
- Exportyta via domänbarrel: `src/features/telemetry/index.ts`

## 📋 Acceptanskriterier
1. `transient_TCK-TEST-001.test.ts` MÅSTE innehålla `eventBus.emit` som Körtidsankare (steel-thread).
2. `transient_TCK-TEST-001.test.ts` MÅSTE falla med exit-kod 1 i Gate 3a innan källkod skrivs.
3. Inga korsvisa FSD-importer får ske (strikt FSD-isolering).
4. `pnpm bygg TCK-TEST-001` ska löpa hela vägen till Teatern (Fas 3) utan manuella inbrott.
