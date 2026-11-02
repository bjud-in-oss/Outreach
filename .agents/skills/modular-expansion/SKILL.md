---
name: modular-expansion
description: Används när en källkodsfil under src/ närmar sig eller överskrider radgränsen (125 rader för UI, 250 rader för logik) för att extrahera hjälpmoduler utan att bryta FSD.
---

# Modular Expansion (Väg 2)

## Syfte
Stycka upp växande moduler inom samma FSD-domän så att filgränserna respekteras utan att källkod amputeras eller externa kontrakt bryts.

## Extraktionsordning (Vad flyttas först?)
1. **Typer & Scheman:** Flytta `interface`, `type` och Zod-scheman till en lokal `types.ts` eller `contracts/` inuti samma domänmapp.
2. **Rena hjälpfunktioner:** Extrahera matematiska funktioner, formaterare och tillståndslösa transformers till en lokal `[namn]Helper.ts`.
3. **Subkomponenter (UI):** Klyv ut delvyer och knappar till mindre komponenter under domänens `ui/`.

## Regler
- **Stanna inom domänen:** Nya hjälpfiler MÅSTE skapas under den aktiva domänen `src/features/[aktiv_domän]/`. Flytta aldrig kod till andra domäner.
- **Uppdatera Barrel (`index.ts`):** Om en extraherad funktion eller typ ingår i domänens publika API, exportera den från domänens `index.ts`.
- **Ingen minifiering:** Skriv normal, läsbar kod. Lös radgränser genom att skapa nya filer, aldrig genom att ta bort radbrytningar eller defensiv felhantering.
