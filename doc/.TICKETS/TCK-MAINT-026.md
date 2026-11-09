# TCK-MAINT-026: Portintegration och Domänförankring i run-path.ts

## 1. MÅL
Integrera Vägmotorns fyra verkliga portkontrakt i körskriptet `scripts/run-path.ts` med korrekta options-parametrar så att orkestreringen passerar genom faktiska domänportar utan körtidsfel, samt säkra regressionen via `scripts/__tests__/run-path.test.ts`.

## 2. INFRASTRUKTURSPECIFIKATION
Berörda filer: `scripts/run-path.ts`, `scripts/__tests__/run-path.test.ts`.

1. `scripts/run-path.ts`:
   - Ersätt `dummyPortar` med anrop till de riktiga portfabrikerna från `../src/features/path`:
     ```typescript
     const portar = {
       avsikt: options.portar?.avsikt || skapaAvsiktsport({
         prompter: async (fraga: string) => {
           io.log(`   🚪 [PORT: AVSIKT] ${fraga}`);
           return 'y';
         },
         beskrivning: `Verifiera intention för ${ticketId}`,
       }),
       provning: options.portar?.provning || skapaProvningsport({
         testFilVag: 'transient_test.ts',
         forvantatFel: 'Fail-First',
         testExekverare: async () => ({
           passerade: false,
           exitKod: 1,
           felmeddelande: 'Förväntat Fail-First fel'
         })
       }),
       konstruktion: options.portar?.konstruktion || skapaKonstruktionsport({
         matris: [],
         inspekterare: async () => ({
           existerar: true,
           antalRader: 50,
           exporteradIIndex: true
         })
       }),
       besiktning: options.portar?.besiktning || skapaBesiktningsport({
         inspekterare: async () => ({ godkand: true })
       }),
     };
     ```
   - Tillåt `options.portar` som valfri override för testbarhet.
   - Behåll mock-adaptern med deterministiska syntetiska svar som standard.

2. `scripts/__tests__/run-path.test.ts`:
   - Verifiera att `exekveraRunPath` exekverar framgångsrikt genom alla fyra domänportarna för både lean- och classic-receptet och returnerar `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. `scripts/run-path.ts` kompilerar och körs utan `TypeError` mot domänportarna.
2. Samtliga tester i `pnpm test` passerar 100 % gröna.
3. `pnpm verify` godkänner hela projektet.
4. Trepunktsbesiktningen godkänns manuellt med `j`.
