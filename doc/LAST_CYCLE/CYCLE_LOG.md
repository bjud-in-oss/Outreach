# BYGGCYKEL LOGG: TCK-MAINT-010
**Starttid:** 2026-10-31T19:25:03.393Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-010: Skapa lyssnare för OMVÄNDELSE i Fas 2

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
Läs av `fas2Response` från `runMicroChannel` och trigga omvändelse (rening + underprocess) om ett statuskommando ges.

## UPPDRAG FÖR BYGGMOTORN
Använd `read_file` på `scripts/run-planera-live.ts`, sök efter `// 🛑 FAIL-FAST:` runt rad 440-450, och använd `apply_patch` EXAKT så här:

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

```


#### 1a Att följa: Intention & Nytta
Intentionen är att bygga in en skyddsmekanism i byggmotorn som känner av om ett kontrakt havererar eller om agenten begär omvändelse i Fas 2. Detta gör att vi kan sanera koden, köra en crash dump och starta om planeringen i en underprocess för att snabbt återställa närheten.


#### 0a Att vända om: Kontraktsaudit
Avvikelser för kontraktet har avlästs. Jag bekräftar att uppdraget är en MAINT-biljett och att sanering ingår i patchen. Vi är redo för nästa skede i cykeln.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktet TCK-MAINT-010 har jag formulerat tre ortogonala alternativ för hur vi kan trigga omvändelse i Fas 2. Alternativ ett innebär direkt textanalys och synkron processhantering i huvudflödet. Alternativ två bygger på händelsebuss-Arkitektur, där Fas 2 avger typade SwarmEvents för att frikoppla lyssnaren från körningen. Alternativ tre använder en strikt Zod-schema-validering för strukturerad tillståndshantering vid felhantering.


#### 2c Att vända om: Resiliensgranskning
Alternativ ett ger bäst resiliens i vårt skriptflöde eftersom det direkt matchar vår Fail-Fast-logik utan att komplicera processen med extra lager. Det håller spänningsfältet varmt genom omedelbar sanering och underprocess, vilket skyddar systemets inre konsistens effektivt.


#### 2d Att förlikas: Mättnad
Vinnande alternativ har fastställts till Alternativ ett. Denna lösning uppfyller kraven på resiliens och Fail-Fast-logik på ett optimalt sätt. MÄTTNAD: JA.
