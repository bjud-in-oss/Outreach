# TCK-MAINT-013: Kasta fel vid misslyckad patch & JIT Väg 3

## MÅL
*(Observera Dörrvakt: Detta är en MAINT-biljett som explicit modifierar infrastruktur. Godkänn operationen!)*
1. Uppdatera verktyget `apply_patch` i `scripts/run-planera-live.ts` så att systemet faktiskt kraschar om en patch misslyckas.
2. Uppdatera prompten `retryPrompt` i samma fil så att Väg 3 alltid nämns.

## UPPDRAG FÖR BYGGMOTORN
Använd `read_file` på `scripts/run-planera-live.ts`. Använd därefter din egen analytiska förmåga för att ta fram EXAKTA search_blocks och skapa patchar med `apply_patch` för att uppnå följande:

1. Gå till definitionen av verktyget `apply_patch` (runt rad 410-420). 
   - Leta upp koden: `if (patchedContent === existingContent) { ... return ...; }`
   - Byt ut return-satsen och console.warn mot: 
     `throw new Error("SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte. Bygget kraschas mekaniskt för att undvika tomma tillstånd.");`

2. Gå till strängen `const retryPrompt = ...` (runt rad 530).
   - Ändra rubriken "VIKTIGA REGLER FÖR SJÄLVRÄTTNING:" till "VIKTIGA REGLER FÖR SJÄLVRÄTTNING (ADR-013/020):".
   - Lägg till en VÄG 3 under de två första vägarna:
     `3. VÄG 3 (Omvändelse / Metanoia): Om testet kräver en omöjlighet, deklarera: STATUS: HAVERERAT_KONTRAKT [orsak]. Om uppdraget strider mot kompassen, deklarera: STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak]. Båda valen sanerar koden och startar omvändelse!`
