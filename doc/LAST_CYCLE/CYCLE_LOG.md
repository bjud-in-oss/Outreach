# BYGGCYKEL LOGG: TCK-MAINT-014
**Starttid:** 2026-10-31T20:24:53.651Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-014: Reparera catch-block och omvändelse-lyssnare

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
1. Ersätt tomma catch-block som fäller Gate 2c med korrekta.
2. Applicera lyssnaren för `STATUS: FÖRLIKANDE_OMVÄNDELSE` i slutet av Fas 2.

## UPPDRAG FÖR BYGGMOTORN
Använd `read_file` på `scripts/run-planera-live.ts`. Använd sedan `apply_patch` med detta exakta sökblock för att laga koden (runt rad 440-455):

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

```


#### 1a Att följa: Intention & Nytta
Givet att byggmotorn exekverar Fas 2 i en efemär mikrokanal,
När en lyssnare detekterar händelsen `STATUS: FÖRLIKANDE_OMVÄNDELSE`,
Så ska systemet avbryta körningen kontrollerat, logga meddelandet och förbereda för förlikning, för att skydda systemets integritet och främja djupare förståelse mellan två perspektiv.


#### 0a Att vända om: Kontraktsaudit
Utför Kontraktsaudit: Uppdraget berör central infrastruktur i `scripts/run-planera-live.ts` och uppfyller kraven för destruktiv sanering. Kontraktet är godkänt för exekvering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för lösningen: Alternativ 1: Direkt patchning via apply_patch i scripts/run-planera-live.ts för att hantera omvändelse-status deterministiskt enligt kontraktets sökblock. Alternativ 2: Händelsedriven omvändelsehantering genom global SwarmEventBus, där Fas 2-resurser avger typade händelser som orkestreras i huvudprocessen. Alternativ 3: Modulär hantering och wrapping i en dedikerad recondiliation-komponent för att bibehålla FSD-isolering och ren felpropagering.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 har bäst resiliens för detta specifika script, då det är deterministiskt och direkt kopplar till processkontrollen. Alternativ 2 riskerar latch-problem vid eventuella avbrott på bussen, och Alternativ 3 brister i FSD-isolering för infrastrukturkod. Jag rekommenderar Alternativ 1 för en säker implementation.


#### 2d Att förlikas: Mättnad
Efter vägning av spänningsfältet mellan de tre alternativen, står det klart att Alternativ 1 bäst främjar systemets resiliens och determinism. Jag slår fast detta vinnande kontrakt och deklarerar MÄTTNAD: JA.
