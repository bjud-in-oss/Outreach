# TCK-MAINT-007: Skapa permanent test för formatMemoryIndicator

## MÅL
Skapa testfilen `src/features/gemini_live_swarm/__tests__/formatMemoryIndicator.test.ts`.

## UPPDRAG FÖR BYGGMOTORN
Använd `save_code` för att skapa `src/features/gemini_live_swarm/__tests__/formatMemoryIndicator.test.ts` med:
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
