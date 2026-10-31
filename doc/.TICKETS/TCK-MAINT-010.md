# TCK-MAINT-010: Skapa lyssnare för OMVÄNDELSE i Fas 2

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
Läs av `fas2Response` i Fas 2 och aktivera omvändelse vid status-deklaration. Uppdatera sedan JIT-instruktionen.

## UPPDRAG FÖR BYGGMOTORN
Använd `read_file` på `scripts/run-planera-live.ts` och därefter `apply_patch` med dessa tre korrekta sökblock.

Patch 1 (JIT Fas 2 instruktion):
search_block:
REGLER OCH DINA 3 TILLÅTNA HANDLINGSVÄGAR (ADR-013):
1. VÄG 1 (Lokal reparation): Rätta koden i befintlig fil via 'apply_patch' (inspektera alltid med 'read_file' först).
2. VÄG 2 (Modulär expansion): Skapa nya hjälpfiler under 'src/features/${targetDomain}/' och exportera via 'index.ts'.
3. VÄG 3 (Process-Fail-Fast / Frivillig Omvändelse): Om testet kräver omöjliga saker som motsäger infrastrukturen: försök inte manipulera testet (det är skrivskyddat). Deklarera i stället omedelbart:
   STATUS: HAVERERAT_KONTRAKT [konkret orsak]
   Detta sanerar källkoden och loopar systemet tillbaka till Fas 1 för omplanering med din fellogg!

replace_block:
REGLER OCH DINA 3 TILLÅTNA HANDLINGSVÄGAR (ADR-013):
1. VÄG 1 (Lokal reparation): Rätta koden i befintlig fil via 'apply_patch' (inspektera alltid med 'read_file' först).
2. VÄG 2 (Modulär expansion): Skapa nya hjälpfiler under 'src/features/${targetDomain}/' och exportera via 'index.ts'.
3. VÄG 3 (Omvändelse / Metanoia):
   a) STATUS: HAVERERAT_KONTRAKT [orsak] (Vid tekniska/arkitektoniska omöjligheter - loopar till Fas 1)
   b) STATUS: FRIVILLIG_OMVÄNDELSE [orsak] (För att frivilligt sanera skuld - loopar till Fas 1)
   c) STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak + fråga] (ADR-020: Om uppdraget strider mot systemets ideala kompass och skapar manipulation/övervakning. Stoppar bygget helt och bjuder in människan till förlikning i Mötesbryggan!)

Patch 2 (Lyssnare):
search_block:
  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {

replace_block:
  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT');
  const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE');
  const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');

  if ((isHaveri || isFrivillig || isForlikande) && !isMaint) {
    const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT');
    console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    if (!process.argv.includes('--omvandelse')) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch (e: any) { console.warn('Kunde inte köra git checkout', e?.message); }
      fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify({ ticket: ticketId, domain: targetDomain, trigger: triggerType, response: fas2Response }, null, 2), 'utf-8');
      if (triggerType === 'FÖRLIKANDE_OMVÄNDELSE') {
        console.error('\n⚖️ [KÖRTIDSRÅD]: Agenten avbryter för förlikning i Mötesbryggan.');
        process.exit(1);
      }
      try {
        console.log('🚀 Startar omplanering i Fas 1 via underprocess...');
        execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
        process.exit(0);
      } catch (err: any) { process.exit(err.status || 1); }
    } else {
      console.error('❌ Cykelspärr nådd.');
      process.exit(1);
    }
  }

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {

Patch 3 (Självrättningsprompten):
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
