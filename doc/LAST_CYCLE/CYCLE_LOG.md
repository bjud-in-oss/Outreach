# BYGGCYKEL LOGG: TCK-MAINT-021
**Starttid:** 2026-11-09T19:35:52.358Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-021: Territorievakt i Fas 0, Skriptgranskare i Verify och Förankring av run-path

## 1. MÅL
Installera tre permanenta arkitekturgrindar som förhindrar att infrastrukturförändringar slinker förbi som vanliga feature-biljetter eller döljs i besiktningsgrinden, samt slutför och verifiera `scripts/run-path.ts` med ett permanent integrationstest i `scripts/__tests__/`.

## 2. INFRASTRUKTUR- OCH KÄLLKODSSPECIFIKATION
Berörda filer: `scripts/run-planera-live.ts`, `scripts/verify-architecture.js`, `scripts/run-path.ts`, `scripts/__tests__/run-path.test.ts`, `package.json`.

1. `scripts/run-planera-live.ts` (Grind A & C):
   - **Grind A (Territorievakt i Fas 0):** Före Fas 0-micro-channels, kontrollera om `!isMaint` och biljetten refererar till filer i `scripts/`, `package.json` eller rotkonfigurationer (`vite.config.ts`). Om så är fallet, avbryt omedelbart:
     ```typescript
     if (!isMaint && (/scripts\/|package\.json|vite\.config/.test(ticketPrompt))) {
       console.error(`❌ GRINDBROTT (Fas 0): Biljetten '${ticketId}' kräver ändringar i infrastruktur (scripts/rotfiler) men är inte en TCK-MAINT-biljett. Använd TCK-MAINT för infrastruktur.`);
       process.exit(1);
     }
     ```
   - **Trepunktsbesiktning (Full transparens):** Kör `execSync('git add -N scripts/ src/ doc/ package.json 2>/dev/null || true', { cwd: ROOT_DIR });` omedelbart före `git diff --stat` så att nyskapade, ospårade filer alltid syns i diffen som människan godkänner.
   - **Grind C (Kravkontroll för MAINT):** Ta bort frikortet `if (isMaint) return [];` i `getRequiredFiles()`. För MAINT-biljetter ska filer under `scripts/` och `scripts/__tests__/` som listas i biljetten inkluderas i kontrollen så att Fas 2 inte kan avslutas utan att filerna faktiskt har skapats.

2. `scripts/verify-architecture.js` (Grind B):
   - **Grind 2b (Typ- och referenskontroll i scripts/):** Utöka AST-skanningen av `scripts/` så att alla `.ts`-filer under `scripts/` skannas efter uppenbara referensfel (t.ex. odefinierade identifierare som `biljettId` utan deklaration) eller valideras programmatiskt med TypeScript AST för att stoppa felaktiga skript innan de når GitHub.

3. `scripts/run-path.ts` & `scripts/__tests__/run-path.test.ts`:
   - Implementera `scripts/run-path.ts` så att den exporterar den testbara funktionen:
     ```typescript
     export async function exekveraRunPath(options: { 
       ticketId?: string; 
       argv?: string[]; 
       io?: { log: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void };
       adapter?: any;
     })
     ```
   - Skriptet ska läsa biljetten, instansiera `skapaPathOrkestrerare` med ett komplett `OrchestratorConfig` (`receptTyp`, `ticketId`, `malDoman`, `uppdrag`, `kontextMinne`), stödja flaggan `--classic` kontra default `lean`, och köra orkestreraren.
   - Skapa det permanenta testet `scripts/__tests__/run-path.test.ts` som importerar och anropar `exekveraRunPath` med ett syntetiskt I/O-objekt och verifierar att `success: true` returneras för både lean- och classic-receptet utan krascher.

4. `package.json`:
   - Säkerställ att `"bygg:path": "tsx --env-file=.env scripts/run-path.ts"` är registrerat under `scripts`.

## 3. ACCEPTANSKRITERIER (Hermetisk TDD och Gate 3a)
1. Samtliga domäntester och det nya testet `scripts/__tests__/run-path.test.ts` ska passera 100 % gröna i `pnpm test`.
2. `pnpm verify` ska validera samtliga filer och passera 100 % grön.
3. Trepunktsbesiktningen i slutet av `pnpm bygg TCK-MAINT-021` ska explicit visa de modifierade och nyskapade filerna i sin diff-stat inför mänskligt godkännande (`j`).

```


#### 1a Att följa: Intention & Nytta
Givet att en infrastrukturvakt och nya skriptgranskare införs för att skydda systemets arkitektur, När gränserna kontrolleras och `run-path.ts` testas, Så säkerställs att alla ändringar följer rätt kontrakt och att systemet förblir intakt och transparent.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. TCK-MAINT-021 berör enbart infrastruktur (scripts och rotfiler) och ingrepp sker inte i fler än en FSD-domän. Inga skadliga eller destruktiva ingrepp krävs. Vi kan gå vidare direkt mot Intent Gatefasen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att lösa TCK-MAINT-021 på ett robust och modulärt sätt.

Alternativ Ett: Direkt integration och linjär skriptutbyggnad. Vi uppdaterar `run-planera-live.ts` och `verify-architecture.js` direkt med grindarna för territorievakt och arkitekturkontroll, samt implementerar `run-path.ts` med dess testsvit i ett sammanhållet svep.

Alternativ Två: Modulär gränshantering och delegerad validering. Vi bryter ut grindslogiken i dedikerade hjälpfunktioner i `scripts/` för att hålla huvudskripten rena, och använder AST-analys för att rigoröst verifiera alla TypeScript-referenser i skriptkatalogen.

Alternativ Tre: Tvåstegs utrullning med strikt kontraktsseparation. Vi implementerar `run-path.ts först via en isolerad process för att säkra dess funktion mot `OrchestratorConfig`, och därefter aktiverar vi territorievakten och de tre arkitekturgrindarna.

Vilket av dessa arkitekturval reflekterar bäst er syn på framtida resiliens och kodstruktur?


#### 2c Att vända om: Resiliensgranskning
Alternativ Två reflekterar bäst vår syn på framtida resiliens och kodstruktur. Genom att bryta ut grindslogiken i dedikerade hjälpfunktioner och använda AST-analys, minskar vi risken för mänskliga faktorn-fel och skapar en mycket mer robust valideringskedja som stoppar trasiga skript innan de når produktion.


#### 2d Att förlikas: Mättnad
Efter en noggrann avvägning av de arkitektoniska alternativen står det klart att Alternativ Två är det vinnande kontraktet. Genom att bryta ut grindslogiken och använda AST-analys skapar vi en nödvändig resiliens och skyddar produktionsmiljön mekaniskt. MÄTTNAD: JA.
