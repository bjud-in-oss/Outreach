# BYGGCYKEL LOGG: TCK-MAINT-010
**Starttid:** 2026-10-31T19:19:25.927Z
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
  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`; await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara eller patcha kod if (!codeSaved && !isMaint) {  replace_block: const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`; const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT'); const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE'); const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');  if ((isHaveri \vert{}\vert{} isFrivillig \vert{}\vert{} isForlikande) && !isMaint) { const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT'); console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    if (!process.argv.includes('--omvandelse')) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch {}
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
Syftet med TCK-MAINT-010 är att stärka körtidsstabiliteten och resiliensen i byggmotorn genom att skapa en aktiv lyssnare för omvändelse-kommunikation.

När en Fas 2-session upptäcker att ett kontrakt har havererat eller att en frivillig omvändelse krävs, kommer systemet nu att automatiskt sanera källkoden, dumpa felstatusen och antingen starta om en förnyad planeringsprocess eller avbryta kontrollerat för förlikning, vilket förhindrar döda cykler och främjar en sund teaterprocess.

Speglade detta din intention? (y/n)


#### 0a Att vända om: Kontraktsaudit
Ja, ändringen speglar intentionen att stärka resiliensen genom att aktivt lyssna efter omvändelse-kommunikation och hantera havererade kontrakt på ett kontrollerat sätt.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-010 och hantera omvändelsebaserade statuskommandon i Fas 2, formulerar jag följande tre ortogonala alternativ:

Alternativ 1: Direkt stränganalys i Orchestratorn. Vi läser av `fas2Response` direkt, använder regex eller strängmatchning för att identifiera statusar och exekverar sedan sanering och subprocessutlöpning omedelbart. Direkt och transparent i koden utan extra beroenden.

Alternativ 2: Strukturerad parsning med Zod. Vi utökar kontraktet för Fas 2 att tvinga fram en strukturerad JSON-payload med ett statusfält i slutet. Denna kan valideras med Zod för högre typsäkerhet och stabilitet.

Alternativ 3: Händelsestyrd feedback via SwarmEventBus. Fas 2 rapporterar sitt utfall via händelsebussen, och en lyssnarkomponent i huvudflödet fångar upp och agerar på de specifika statusarna. Detta gör arkitekturen mer frikopplad och modulär.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att Alternativ 1, direkt stränganalys, är sårbar för variationer i AI-svaret, vilket skapar risk för latenta haverier. Alternativ 3, händelsestyrd feedback via SwarmEventBus, ger bäst systemresiliens och följer våra designprinciper om frikoppling. Vi implementerar därför nuvarande patch motvilligt i enlighet med TCK, men rekommenderar en övergång till händelsestyrd arkitektur.


#### 2d Att förlikas: Mättnad
Vi väger spänningsfältet mellan idealarkitekturens resiliens och den aktuella biljetttilldelningens krav. Vi fastställer att Alternativ 1 implementeras i enlighet med TCK, men vi låser samtidigt rekommendationen om en övergång till den händelsestyrda arkitekturen i Alternativ 3 för framtida resiliens. MÄTTNAD: JA.
