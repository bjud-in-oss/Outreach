import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../features/gemini_live_swarm/ui/promptBarHelper';

describe('TCK-034 - Memory Indicator Display', () => {
  it('should format memory indicator correctly for various usage ratios', () => {
    expect(formatMemoryIndicator(undefined)).toBe('[Ledigt --%]');
    expect(formatMemoryIndicator(0)).toBe('[Ledigt 100%]');
    expect(formatMemoryIndicator(0.25)).toBe('[Ledigt 75%]');
    expect(formatMemoryIndicator(0.5)).toBe('[Ledigt 50%]');
    expect(formatMemoryIndicator(0.75)).toBe('[Ledigt 25%]');
    expect(formatMemoryIndicator(1)).toBe('[Ledigt 0%]');
  });

  it('should clamp usage ratios outside the 0-1 range', () => {
    expect(formatMemoryIndicator(-0.1)).toBe('[Ledigt 100%]');
    expect(formatMemoryIndicator(1.1)).toBe('[Ledigt 0%]');
  });
});
