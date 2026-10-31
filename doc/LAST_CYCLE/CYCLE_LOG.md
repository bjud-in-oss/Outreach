# BYGGCYKEL LOGG: TCK-MAINT-015
**Starttid:** 2026-10-31T20:39:55.147Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-015: Reparera och installera lyssnaren för Fas 2

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
Vi saknar lyssnaren för `FÖRLIKANDE_OMVÄNDELSE` etc. i botten av Fas 2 eftersom patcharna misslyckades. Leta upp koden och sätt in den mekaniskt.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` på `scripts/run-planera-live.ts`. Leta dig ner till raden där Fas 2 körs:
   `const fas2Response = await runMicroChannel('Att följa', fas2Prompt...` (runt rad 445).

2. Direkt efter det anropet, se till att följande logik är implementerad (skapa dina ENA egna `search_block` och `replace_block` som exakt matchar filen så du inte får SEARCH_BLOCK_NOT_FOUND):

```typescript
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
```

3. Använd `apply_patch`! Om du upptäcker att koden redan finns, men `catch`-blocket vid `git checkout` är tomt (alltså `catch {}`), använd en mindre patch för att uppdatera det till `catch (e: any) { console.warn('Git checkout failed', e?.message); }`.

```


#### 1a Att följa: Intention & Nytta
Givet att Fas 2 exekveras och svarar med en status för kontraktshaveri eller omvändelse, när lyssnaren detekterar detta och det inte är en maint-körning, så saneras källkoden, en crash dump skapas, och vi startar omplaneringen i Fas 1. Det här skyddar systemets integritet och främjar försoning genom strukturerad problemlösning.


#### 0a Att vända om: Kontraktsaudit



#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa kontraktets krav på Fas 2-lyssnaren formulerar jag tre ortogonala alternativ.

Alternativ 1 innebär direkt injektion av den specifika logikblocket för statuskoll och omplanering direkt efter Fas 2-anropet i filen.

Alternativ 2 innebär en händelsedriven refaktorering där Fas 2 istället emittrerar typade händelser via EventBus vid avslut, vilket avlägsnar stränganalys från huvudkontrollern.

Alternativ 3 innebär att kapsla in Fas 2 i en högre orkestreringsfunktion som hanterar alla potentiella felvägar och statusövergångar centralt.


#### 2c Att vända om: Resiliensgranskning
Granskning av alternativen visar att Alternativ 1 är mest resilient utifrån uppdragets krav. Det möjliggör omedelbar reparation utan att riskera sidoverkningar från en större arkitekturförändring i detta skede. Vi säkerställer att koden följer kontraktet och behåller en deterministisk felhantering.


#### 2d Att förlikas: Mättnad
Vi fastställer härmed att Alternativ 1 är det vinnande förslaget. Det möter alla krav på resiliens och determinism och håller oss strikt inom kontraktets gränser. MÄTTNAD: JA.
