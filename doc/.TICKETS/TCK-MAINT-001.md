# TCK-MAINT-001: Infrastrukturreparation och Biljettstädning

## MÅL
1. Åtgärda rad 128 i `src/features/gemini_live_swarm/index.ts`:
   - Ta bort den ogiltiga raden `export * from './promptBarHelper';`.
   - Exportera `formatMemoryIndicator` korrekt från `./ui/promptBarHelper.ts`.
2. Åtgärda `scripts/run-planera-live.ts`:
   - När moduler exporteras i `index.ts` under barrel-uppdateringen ska undermappar bevaras (`ui/` etc.) istället för att strippas med `path.basename()`.
3. Åtgärda `scripts/samrad.ts`:
   - Importera `execSync` från `child_process`.
   - Lär Mötesbryggan att om användaren vill åtgärda skript/dokumentation/infrastruktur ska den skapa en `TCK-MAINT-XXX`-biljett (utan krav på `export function` eller `.feature`-filer).
   - Mötesbryggan ska endast erbjuda att starta byggmotorn om en ny biljett faktiskt skapades under den aktiva sessionen.
4. Biljettstädning i `doc/TICKETS.md`:
   - Markera `TCK-034` som `[x] **TCK-034** (VERIFIED)`.
   - Markera `TCK-TEST-001` som `[x] **TCK-TEST-001** (VERIFIED)`.
   - Radera eventuella transienta testfiler i `src/__tests__/`.
