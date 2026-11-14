# BYGGCYKEL LOGG: TCK-MAINT-081
**Starttid:** 2026-11-14T23:30:24.550Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-081: Samla samtliga matchande felrader ur hela loggen i extractErrorSignature och verifiera med enhetstest

**Måldomän:** `scripts`
**Målfiler:** `scripts/lib/ticketAndAnchor.ts`, `scripts/__tests__/scriptLibs.test.ts`
**Förutsättning:** `TCK-MAINT-079` måste vara `VERIFIED`.
**Mekanisk Acceptans:**
1. `scripts/lib/ticketAndAnchor.ts` (< 175 rader) uppdaterar `extractErrorSignature(log: string, maxLines = 15): string` till att filtrera **hela** loggen (`log.split('\n').filter(l => signatureRegex.test(l)).slice(0, maxLines).join('\n')`) så att felrader överst aldrig klipps bort av långa Node-stacktraces längst ned.
2. `scripts/__tests__/scriptLibs.test.ts` (< 125 rader) lägger till ett enhetstest för `extractErrorSignature` som bevisar att både `✘ [ERROR] No matching export...` och `error TS2322` extraheras ur en 30-raders logg medan stacktrace-rader filtreras bort.
3. `pnpm verify` passerar med exit 0.

```


#### 1a Att följa: Intention & Nytta
Hej! Det här uppdraget handlar om att göra vår felhantering mer robust. Genom att samla alla matchande felrader från hela loggen, istället för att bara titta på slutet, ser vi till att viktiga felmeddelanden inte döljs bakom långa stacktraces. Det gör felsökningen mycket smidigare för dig. Låter det som en bra plan?


#### 0a Att vända om: Kontraktsaudit
Jag har granskat kontraktet för TCK-MAINT-081. Måldomänen är scripts, och vi håller oss strikt till de angivna filerna utan att sprida ut ändringarna. De mekaniska acceptanskraven förhindrar monolitisk kod växt genom att sätta hårda radgränser. Allt är redo för nästa skede i byggprocessen.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ



#### 2c Att vända om: Resiliensgranskning
För att säkra resiliensen i `extractErrorSignature` granskar vi två alternativ. Alternativ ett innebär att skanna hela loggen från toppen till botten, filtrera med signatureRegex och begränsa till max rader. Risken här är prestanda vid enorma loggfiler. Alternativ två är att begränsa sökningen till de sista N raderna efter stacktraces, men då kan vi missa tidiga fel. Vårt val blir att prioritera fullständig spårbarhet, vilket gör alternativ ett vinnare, förutsatt att vi begränsar maxLines strikt.


#### 2d Att förlikas: Mättnad
Alternativ ett är det vinnande alternativet. Vi prioriterar fullständig spårbarhet och säkrar resiliensen genom att strikt begränsa parametern `maxLines`. MÄTTNAD: JA.
