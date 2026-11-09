# BYGGCYKEL LOGG: TCK-MAINT-020
**Starttid:** 2026-11-09T19:15:36.198Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-020: Mekaniskt Förankrat Körskript för Vägmotorn (run-path.ts)

## 1. MÅL
Ersätt det trasiga körskriptet med en ny, testdriven implementation av `scripts/run-path.ts` som kan exekvera Vägmotorn parallellt, och registrera kommandot `bygg:path` i `package.json`. För att garantera att skriptet fungerar och att FSD-gränser respekteras införs även ett formellt integrationstest i `scripts/__tests__/`. 

## 2. KÄLLKODSSPECIFIKATION
Domäner: `scripts/`, `vite.config.ts`, `package.json`.

1. `vite.config.ts`:
   - Lägg till `'scripts/**/*.test.{ts,js}'` i `test.include`-arrayen så att Vitest även plockar upp tester under `scripts/`.

2. `scripts/run-path.ts`:
   - Skall exportera en testbar modulär funktion `exekveraRunPath(ticketId: string, argv: string[], env: Record<string, string>, io: { log: Function, error: Function })` som instansierar orkestreraren, kör receptet (lean eller classic) och returnerar resultatet utan att anropa `process.exit()`.
   - Skall endast anropa `process.exit()` i ett fristående if-block längst ned (`if (require.main === module) { ... }` motsvarande) om filen körs direkt från CLI.
   - Skall initiera `skapaPathOrkestrerare` (från `src/features/path`) med dummy-portar och en `skapaMockSessionAdapter`.
   - `config.receptTyp` styrs av om flaggan `--classic` finns i argumenten.
   - Skall formatera `userPrompt` korrekt till `MockSessionAdapter`.

3. `scripts/__tests__/run-path.test.ts`:
   - Skapa ett permanent enhetstest för `run-path.ts`.
   - Testet ska anropa `exekveraRunPath` med syntetiska I/O-objekt (mocks för log/error) och bevisa att orkestreraren kan köras utan `ReferenceError` eller `TypeError`.

4. `package.json`:
   - Skall innehålla skriptet `"bygg:path": "tsx --env-file=.env scripts/run-path.ts"`.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Det ska finnas ett transient test `src/__tests__/transient_TCK-MAINT-020.test.ts` som instansierar `exekveraRunPath` och verifierar att `success: true` returneras för ett mockat körfall.
2. `pnpm test` ska visa att både det nya testet i `scripts/__tests__/` och det transienta testet är 100 % gröna.
3. Trepunktsbesiktningen i slutet av körningen måste manuellt godkännas av användaren.

```


#### 1a Att följa: Intention & Nytta
Givet att ett trasigt körskript hindrar exekvering av Vägmotorn, När skriptet scripts run-path ts körs genom bygg path med korrekta parametrar, Så ska Vägmotorn exekvera orkestreraren framgångsrikt och returnera success true utan att stänga processen abruptly.


#### 0a Att vända om: Kontraktsaudit
Jag har genomfört en kontraktsaudit för TCK-MAINT-020 och verifierarJag har genomfört kontraktsauditen och den är godkänd. Uppdraget rör justeringar i konfigurationsfiler och körskript i roten, vilket inte påverkar de isolerade domänerna under `src/features/`. Vi kan därmed gå vidare.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa TCK-MAINT-020:

Alternativ 1 fokuserar på en minimalistisk och direkt modell, där `run-path.ts` samlar all nödvändig logik i en och samma fil och strikt följer exportkraven.

Alternativ 2 bygger ut med en mer modulär arkitektur, där vi separerar skapandet av portar och adaptrar i hjälpare, vilket underlättar framtida underhåll.

Alternativ 3 prioriterar TDD genom att definiera testfallen först, vilket säkerställer perfekt täckning och stabilitet innan källkoden slutförs.


#### 2c Att vända om: Resiliensgranskning
Vid granskning av alternativen för TCK-MAINT-020 visar det sig att Alternativ 2, med separata hjälpare för portar och adaptrar, ger bäst robusthet och enklare felisolering. Det minskar risken för ReferenceErrors och främjar god FSD-isolering.


#### 2d Att förlikas: Mättnad
Jag fastställer att Alternativ 2 är det vinnande kontraktet. Genom att använda separata hjälpare för portar och adaptrar maximerar vi robustheten och förenklar felisoleringen, vilket säkerställer en god FSD-isolering. Jag deklarerar härmed MÄTTNAD: JA.
