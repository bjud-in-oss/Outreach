import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../features/gemini_live_swarm';

describe('TCK-034 - Visning av kontextminne', () => {
  it('should format memory usage correctly', () => {
    const mockMetric = {
      usedTokens: 2500,
      maxTokens: 8192,
    };

    const result = formatMemoryIndicator(mockMetric);

    expect(result).toBe('2500 / 8192 tokens');
  });
});