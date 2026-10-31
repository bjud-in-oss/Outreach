# TCK-MAINT-015: Reparera och installera lyssnaren för Fas 2

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
Vi saknar lyssnaren för FÖRLIKANDE_OMVÄNDELSE i botten av Fas 2. Lägg in den via apply_patch.

## UPPDRAG FÖR BYGGMOTORN
Använd `apply_patch` på `scripts/run-planera-live.ts` för att leta upp de sista raderna i anropet till `runMicroChannel` och byta ut dem. 
Använd FÖLJANDE sökblock och ersättningsblock BOKSTAVLIGEN:

search_block:
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod
  if (!codeSaved && !isMaint) {
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }

replace_block:
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT');
  const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE');
  const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');

  if ((isHaveri || isFrivillig || isForlikande) && !isMaint) {
    const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT');
    console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    
    if (!process.argv.includes('--omvandelse')) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch (e: any) { console.warn('Git checkout failed', e?.message); }
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
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }
