# BYGGCYKEL LOGG: TCK-MAINT-009
**Starttid:** 2026-10-31T17:04:53.749Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-009: Implementera ADR-013 Omvändelseslingan och JIT Process-Fail-Fast

## MÅL
Aktivera ADR-013 i `scripts/run-planera-live.ts`:
1. Informera agenten via JIT i Fas 2 om Väg 3 (frivillig omvändelse via `STATUS: HAVERERAT_KONTRAKT`).
2. Fånga `STATUS: HAVERERAT_KONTRAKT` mekaniskt i Fas 2.
3. Starta om via ren underprocess (`--omvandelse`) och läs in kraschdumpen i Fas 1.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/run-planera-live.ts`.
2. Använd `apply_patch` för att:

Patch 1 (Läs in kraschdump i Fas 1 vid omvändelse, runt rad 180–190):
search_block:
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}${busContract}`;

replace_block:
  let crashDumpContext = '';
  if (fs.existsSync(CRASH_DUMP_PATH)) {
    try {
      const dump = fs.readFileSync(CRASH_DUMP_PATH, 'utf-8');
      crashDumpContext = `\n\n⚠️ TIDIGARE BYGGFÖRSÖK HAVERERADE I FAS 2 (OMVÄNDELSE AKTIVERAD):\n${dump}\nAnalysera felet ovan i Fas 1 och välj ett hållbart kontrakt som undviker detta haveri!`;
      fs.unlinkSync(CRASH_DUMP_PATH);
    } catch (err: any) {
      console.warn(`⚠️ [OMVÄNDELSE]: Kunde inte läsa kraschdump: ${err?.message || err}`);
    }
  }
  const startAnchor = `BILJETT: ${ticketId}\nDOMÄN: ${targetDomain}\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\nKONTRAKT:\n${ticketPrompt}${busContract}${crashDumpContext}`;

Patch 2 (Uppdatera JIT-prompterna i Fas 2 med de 3 vägarna, runt rad 415–430):
search_block:
REGLER OCH DINA 4 TILLÅTNA STRATEGIER:
1. TESTFILEN ÄR FÖRBJUDEN ATT RÖRA: Alla anrop mot 'src/__tests__/' avvisas mekaniskt!
2. MODULÄR DESIGN: Skapa specifika källkodsfiler och exportera dem via 'index.ts'.
3. FULL KONTRAKTSEFTERLEVNAD: Källkoden MÅSTE använda Zod-scheman och returnera korrekta typer.
4. EPISTEMISK ÖDMJUKHET (INSPEKTERA ALLTID FÖRE PATCH): Om du ska ändra en befintlig fil med 'apply_patch', MÅSTE du FÖRST anropa 'read_file' på den filen. Kopiera sedan ut 1-2 rader EXAKT som de ser ut i filen till ditt 'search_block'. Gissa ALDRIG radbrytningar eller indentering!

replace_block:
REGLER OCH DINA 3 TILLÅTNA HANDLINGSVÄGAR (ADR-013):
1. VÄG 1 (Lokal reparation): Rätta koden i befintlig fil via 'apply_patch' (inspektera alltid med 'read_file' först).
2. VÄG 2 (Modulär expansion): Skapa nya hjälpfiler under 'src/features/${targetDomain}/' och exportera via 'index.ts'.
3. VÄG 3 (Process-Fail-Fast / Frivillig Omvändelse): Om testet kräver omöjliga saker som motsäger infrastrukturen: försök inte manipulera testet (det är skrivskyddat). Deklarera i stället omedelbart:
   STATUS: HAVERERAT_KONTRAKT [konkret orsak]
   Detta sanerar källkoden och loopar systemet tillbaka till Fas 1 för omplanering med din fellogg!

Patch 3 (Fånga HAVERERAT_KONTRAKT och hantera 3 misslyckade försök med ren underprocess, runt rad 470–485):
search_block:
        if (attempts >= 3) {
          console.error('❌ Maximalt antal självrättningsförsök uppnått.');
          process.exit(1);
        }

replace_block:
        if (attempts >= 3) {
          console.error('❌ Maximalt antal självrättningsförsök uppnått i Fas 2.');
          const isOmvandelse = process.argv.includes('--omvandelse');
          
          if (!isOmvandelse && !isMaint) {
            console.log('\n🔄 [ADR-013 OMVÄNDELSESLINGA]: Sanerar källkod och startar om via ren underprocess...');
            try {
              execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR });
            } catch (err: any) {
              console.warn(`⚠️ [OMVÄNDELSE]: Kunde inte köra git checkout: ${err?.message || err}`);
            }
            
            const dumpData = { ticket: ticketId, domain: targetDomain, error: vitestErr?.message, log: testLog, time: new Date().toISOString() };
            fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify(dumpData, null, 2), 'utf-8');
            
            console.log('🚀 Startar isolerad underprocess för Fas 1 omplanering...\n');
            try {
              execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
              process.exit(0);
            } catch (subErr: any) {
              console.error('❌ Omvändelseslingan underkändes i andra försöket.');
              process.exit(subErr.status || 1);
            }
          } else {
            console.error('❌ Cykelspärr nådd: Max 1 omvändelse tillåten per körning.');
            process.exit(1);
          }
        }

```


#### 1a Att följa: Intention & Nytta
För att främja processresiliens och ge byggmotorn en mekanisk räddningsplanka vid omöjliga kontrakt, formulerar jag följande beteendekontrakt:

Givet att en agent exekverar sin uppgift i Fas 2,

När en oöverstiglig konflikt med oföränderlig infrastruktur identifieras och agenten deklarerar STATUS: HAVERERAT_KONTRAKT,

Så ska systemet omedelbart avbryta, sanera ofullständiga ändringar, spara en kraschdump och starta en isolerad Fas 1-omplanering underprocess med felanalysen.

Speglade detta din intention? (y/n)


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Kontraktet speglar fullt ut intentionen för ADR-013 gällande resiliens, sanering och automatisk omplanering.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att hantera ADR-013 och skapa JIT-process-fail-fast kan vi formulera tre ortogonala alternativ.

Det första alternativet är ett in-process tillstånds-reset där vi använder händelsebussen för att signalera fel och återställa systemet utan att starta om underprocesser.

Det andra alternativet är en filbaserad kraschdump och underprocessomstart, vilket är kontraktets föreslagna metod med git-rening och återplanering från en extern fellogg.

Det tredje alternativet utnyttjar MCP Bridge för att kommunicera felet direkt till orkestratorn och om-dekomponera ticketen i realtid istället för via direkt exekvering i Fas 2.


#### 2c Att vända om: Resiliensgranskning
Det första alternativet, som innebär ett in-process tillstånds-reset, är snabbt men innebär en hög risk för kontaminering i nästa fas eftersom skadade tillstånd kan dröja kvar.

Det andra alternativet, med filbaserad kraschdump och omstart i en ren underprocess, är det mest resilienta. Det säkerställer en fullständig isolering och rening, vilket stämmer bäst överens med kontraktets krav.

Det tredje alternativet via MCP Bridge är visserligen bra för orkestrering, men tillför onödig komplexitet för den isolerade omvändelseslingan. Jag rekommenderar därför det andra alternativet.


#### 2d Att förlikas: Mättnad
Jag fastställer det vinnande alternativet som det andra: filbaserad kraschdump och omstart i en ren underprocess. Detta garanterar fullständig isolering och resiliens, vilket är i linje med vårt kontraktuella krav. Mättnad: JA.
