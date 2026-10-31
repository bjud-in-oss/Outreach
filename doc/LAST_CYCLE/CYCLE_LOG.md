# BYGGCYKEL LOGG: TCK-MAINT-010
**Starttid:** 2026-10-31T18:57:23.040Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-010: Mekanisk lyssnare för de tre omvändelsevägarna i Fas 2

## MÅL
Koppla in körtidslyssnaren i `scripts/run-planera-live.ts` så att Fas 2 fångar och hanterar:
1. `STATUS: HAVERERAT_KONTRAKT`
2. `STATUS: FRIVILLIG_OMVÄNDELSE`
3. `STATUS: FÖRLIKANDE_OMVÄNDELSE` (ADR-020)

De två första startar om Fas 1 via underprocess. Den sista avbryter bygget helt för mänskligt samråd i Mötesbryggan.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` på `scripts/run-planera-live.ts` (studera Fas 2: rad 440-455 och 520-540).
2. Använd `apply_patch` för att utföra följande tre byten:

Patch 1 (Uppdatera JIT-prompterna med de 3 Vägarna):
search_block:
3. VÄG 3 (Process-Fail-Fast / Frivillig Omvändelse): Om testet kräver omöjliga saker som motsäger infrastrukturen: försök inte manipulera testet (det är skrivskyddat). Deklarera i stället omedelbart:
   STATUS: HAVERERAT_KONTRAKT [konkret orsak]
   Detta sanerar källkoden och loopar systemet tillbaka till Fas 1 för omplanering med din fellogg!

replace_block:
3. VÄG 3 (Omvändelse / Metanoia):
   a) STATUS: HAVERERAT_KONTRAKT [orsak] (Vid tekniska/arkitektoniska omöjligheter - loopar till Fas 1)
   b) STATUS: FRIVILLIG_OMVÄNDELSE [orsak] (För att frivilligt sanera skuld - loopar till Fas 1)
   c) STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak + fråga] (ADR-020: Om uppdraget strider mot systemets ideala kompass och skapar manipulation/övervakning. Stoppar bygget helt och bjuder in människan till förlikning i Mötesbryggan!)

Patch 2 (Fånga ropen och routea dem):
search_block:
  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }

replace_block:
  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT');
  const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE');
  const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');

  if ((isHaveri || isFrivillig || isForlikande) && !isMaint) {
    const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT');
    console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    const isOmvandelse = process.argv.includes('--omvandelse');
    if (!isOmvandelse) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch {}
      const dumpData = { ticket: ticketId, domain: targetDomain, trigger: triggerType, response: fas2Response, time: new Date().toISOString() };
      fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify(dumpData, null, 2), 'utf-8');
      
      if (triggerType === 'FÖRLIKANDE_OMVÄNDELSE') {
        console.error('\n⚖️ [KÖRTIDSRÅD]: Agenten åberopar moralisk handlingsfrihet. Bygget avbryts för förlikning med domänexpert i Mötesbryggan.');
        process.exit(1);
      }
      
      try {
        console.log('🚀 Startar omplanering i Fas 1 via underprocess...');
        execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
        process.exit(0);
      } catch (subErr: any) { process.exit(subErr.status || 1); }
    } else {
      console.error('❌ Cykelspärr nådd: Omvändelseslingan kan endast köras en gång per uppdrag.');
      process.exit(1);
    }
  }

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }

Patch 3 (Erbjud Väg 3 i självrättningsprompten om testet kraschar):
search_block:
VIKTIGA REGLER FÖR SJÄLVRÄTTNING:
1. TESTFILEN ÄR STRIKT SKRIVSKYDDAD OCH FÅR INTE ÄNDRAS. Att försöka spara till '${transientTestFile}' avvisas mekaniskt!
2. Du MÅSTE åtgärda felet genom att skriva och spara om källkoden under 'src/features/${targetDomain}/' via save_code!
3. Analysera felet mot testet och din befintliga källkod nedan, korrigera källkoden och anropa save_code omedelbart.

replace_block:
VIKTIGA REGLER FÖR SJÄLVRÄTTNING (ADR-013/020):
1. TESTFILEN ÄR STRIKT SKRIVSKYDDAD OCH FÅR INTE ÄNDRAS.
2. VÄG 1 & 2: Åtgärda felet i källkoden under 'src/features/${targetDomain}/' via save_code eller apply_patch.
3. VÄG 3 (Omvändelse / Metanoia): Om testet kräver en omöjlighet (HAVERERAT_KONTRAKT), om arkitekturen blev skadlig (FRIVILLIG_OMVÄNDELSE), eller om uppdraget strider mot systemets ideala kompass (FÖRLIKANDE_OMVÄNDELSE):
   Deklarera omedelbart rätt STATUS för att sanera koden och påbörja omvändelse!

```


#### 1a Att följa: Intention & Nytta
Jag har analyserat TCK-MAINT-010. Intentionen är att bygga in en moralisk och mekanisk säkerhetsventil i Fas 2.

Mänsklig nytta: Genom att ge agenten förmågan att åberopa "FÖRLIKANDE_OMVÄNDELSE" skyddas systemet från exekveringsstigar som strider mot dess grundläggande kompass. Detta skapar förutsättningar för en djupare dialog och förlikning mellan mänsklig intention och artificiell exekvering. Gherkin-scenariot låses nu som vårt beteendekontrakt.


#### 0a Att vända om: Kontraktsaudit
Givet en pågående Fas 2 exekvering, när körtidslyssnaren fångar en signal om moralisk eller teknisk omöjlighet, så måste systemet omedelbart sanera källkoden och antingen omplanera i Fas 1 eller avbryta för förlikning. Speglade detta din intention?


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
De tre ortogonala alternativen är: Först, inline synkron detektering via direkt stränganalys av agentens respons innan mutation sker. Sedan, ett observermönster via EventBussen som fångar upp särskilda statusmeddelanden i realtid. Och sist, en strikt semantisk validering av payloaden innan byggmotorn accepterar förändringen i Fas 2.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1, alltså direkt stränganalys, är den mest resilienta för Fas 2 eftersom den avbryter omedelbart innan källkoden muteras, vilket hindrar att trasiga tillstånd sprids vidare. Däremot kräver den att agenten strikt håller sig till de exakta strängarna för att inte missa någon signal.


#### 2d Att förlikas: Mättnad
Eftersom direkt stränganalys innebär en mekanisk risk för falska negativer, och motverkar kravet på funktionell testning i minnet, fastställer jag att Alternativ 1 inte vinner. MÄTTNAD: JA.
