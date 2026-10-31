# TCK-MAINT-008: Implementera ADR-013 Omvändelseslingan i run-planera-live.ts

## MÅL
Bygg in ADR-013 i `scripts/run-planera-live.ts` så att motorn vid haveri i Fas 2 sanerar källkod, sparar kraschdump och loopar tillbaka till Fas 1 för omplanering (max 1 omvändelse).

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/run-planera-live.ts` runt Fas 1-starten (rad 180) och Fas 2-testloopen (rad 460–505).
2. Använd `apply_patch` för att:
   a) Definiera `CRASH_DUMP_PATH`, `omvandelseCount = 0` och omsluta Fas 1 och Fas 2 i en omvändelseslinga `while (omvandelseCount <= maxOmvandelse)`.
   b) Om `attempts >= 3` i Fas 2:
      - Om `omvandelseCount < maxOmvandelse`: öka räknaren, kör `git checkout -- src/features/${targetDomain}`, skriv kraschlogg till `doc/LAST_CYCLE/CRASH_DUMP.json`, och bryt Fas 2 för att starta om Fas 1 med kraschdumpen i startankaret.
      - Om `omvandelseCount >= maxOmvandelse`: avbryt med `process.exit(1)`.
   c) Vid godkänt test: bryt omvändelseslingan och fortsätt till Fas 3.
