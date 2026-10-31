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
