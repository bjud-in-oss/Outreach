# BYGGCYKEL LOGG: TCK-MAINT-006
**Starttid:** 2026-10-31T16:04:21.228Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-006: Defensiv formatMemoryIndicator och konsolidering av TCK-034

## MÅL
1. Gör `formatMemoryIndicator` i `src/features/gemini_live_swarm/ui/promptBarHelper.ts` defensiv så att den hanterar tomma anrop (fallback: `0 / 8192 tokens`) och siffror, utan att krascha vid undefined.
2. Skapa den permanenta testfilen `src/features/gemini_live_swarm/__tests__/formatMemoryIndicator.test.ts`.
3. Markera TCK-034 som VERIFIED i `doc/TICKETS.md`.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` på `src/features/gemini_live_swarm/ui/promptBarHelper.ts`.
2. Använd `apply_patch` för att uppdatera `formatMemoryIndicator`:
search_block:
export function formatMemoryIndicator(metric: ContextUsageMetric): string {
  return `${metric.usedTokens} / ${metric.maxTokens} tokens`;
}

replace_block:
export function formatMemoryIndicator(metric?: any): string {
  if (!metric || typeof metric !== 'object') return '0 / 8192 tokens';
  return `${metric.usedTokens ?? 0} / ${metric.maxTokens ?? 8192} tokens`;
}

3. Använd `save_code` för att skapa `src/features/gemini_live_swarm/__tests__/formatMemoryIndicator.test.ts`:
import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../index.ts';

describe('TCK-034 - Visning av kontextminne', () => {
  it('should format memory usage correctly', () => {
    const mockMetric = { usedTokens: 2500, maxTokens: 8192 };
    expect(formatMemoryIndicator(mockMetric)).toBe('2500 / 8192 tokens');
  });

  it('should provide fallback when called empty', () => {
    expect(formatMemoryIndicator()).toBe('0 / 8192 tokens');
  });
});

4. Använd `apply_patch` på `doc/TICKETS.md`:
search_block:
- [ ] **TCK-034**: (Skapad via samrad)

replace_block:
- [x] **TCK-034** (VERIFIED): Visning av kontextminne

```


#### 1a Att följa: Intention & Nytta
Givet att minnesindikatorn anropas utan eller med ofullständig mätvärdesdata, När funktionen `formatMemoryIndicator` exekveras utan giltig data, Då skall en fallback-sträng returneras som visar "0 / 8192 tokens" i ställer för att krascha applikationen.


#### 0a Att vända om: Kontraktsaudit
Kontraktsaudit genomförd. Alla ändringar sker inom en och samma FSD-domän `gemini_live_swarm`, och vi uppfyller samtliga krav för en trygg exekvering. Processen är redo för nästa steg.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-006 formulerar jag tre ortogonala alternativ.

Alternativ ett är direkt funktionspatchning, där vi implementerar defensiva kontroller och fallback-värden direkt i `formatMemoryIndicator` för ett minimalt koddelta.

Alternativ två är strikt datavalidering via Zod, där vi validerar konfigurationen och returnerar standardsträngen vid ogiltig input.

Alternativ tre är hookbaserad hantering genom att flytta logiken till en `useMemoryIndicator`-hook, vilket separerar tillståndshantering från presentationslagret.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ ett bäst skyddar systemet mot krascher genom att direkt hantera felaktiga tillstånd lokalt, utan att bygga in onödig komplexitet som i alternativ tre, och det är mer kostnadseffektivt än Zod-validering för en ren presentationsfunktion.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och utvärderat spänningen mellan stabilitet och komplexitet. Jag slår fast att Alternativ 1 är det vinnande kontraktet. MÄTTNAD: JA.
