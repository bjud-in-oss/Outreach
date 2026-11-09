# TCK-MAINT-019: Etablera Parallellt Körskript run-path.ts och package.json-alias

## 1. MÅL
Etablera det parallella körskriptet `scripts/run-path.ts` och registrera npm-kommandot `"bygg:path"` i `package.json` enligt ADR-029 (Strangler Fig). Skriptet ska möjliggöra autonom provkörning av Vägmotorn (`src/features/path/`) via terminalen.

## 2. INFRASTRUKTURSPECIFIKATION
1. `scripts/run-path.ts`:
   - Läser in biljett-id från `process.argv[2]` (fallback: 'PROMPT').
   - Läser biljetttexten och extraherar måldomän.
   - Instansierar `skapaPathOrkestrerare` med `skapaMockSessionAdapter` och dummy-portar.
   - Kör orkestreraren och loggar slutrapport i terminalen.
2. `package.json`:
   - Lägg till skriptet `"bygg:path": "tsx --env-file=.env scripts/run-path.ts"`.

## 3. ACCEPTANSKRITERIER
1. `scripts/run-path.ts` existerar och kan exekveras utan syntax- eller körtidsfel.
2. `pnpm verify` passerar 100 % grön.
