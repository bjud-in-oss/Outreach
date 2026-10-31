# TCK-MAINT-012: Hård avbrytning vid patch-fel och JIT-självrättning

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
1. Kasta Error i apply_patch om sökblocket saknas, så systemet kraschar direkt vid fel.
2. Uppdatera självrättningsprompten med Väg 3.

## UPPDRAG FÖR BYGGMOTORN
Använd read_file på scripts/run-planera-live.ts, och därefter apply_patch.

Patch 1 (Kasta Error om patch inte hittas, runt rad 410):
search_block:
      const patchedContent = applySourcePatch(existingContent, args.search_block, args.replace_block);
      if (patchedContent === existingContent) {
        console.warn(`\n   ❌ [VERKTYGSFEL]: SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte i '${rel}'. Kontrollera indrag och omgivande rader.`);
        return `SEARCH_BLOCK_NOT_FOUND: Kunde inte hitta 'search_block' i filen. Sökblocket måste stämma EXAKT överens med filen, inklusive whitespace!`;
      }

replace_block:
      const patchedContent = applySourcePatch(existingContent, args.search_block, args.replace_block);
      if (patchedContent === existingContent) {
        throw new Error(`SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte i '${rel}'. Bygget kraschas mekaniskt för att undvika tomma tillstånd.`);
      }

Patch 2 (Väg 3 i Självrättningen, runt rad 530):
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
