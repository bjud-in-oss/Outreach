import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../features/gemini_live_swarm/ui/promptBarHelper';

describe('formatMemoryIndicator', () => {
  it('should return default string when usageRatio is undefined', () => {
    expect(formatMemoryIndicator(undefined)).toBe('[Ledigt --%]');
  });

  it('should calculate correct free percentage for 0 usage', () => {
    expect(formatMemoryIndicator(0)).toBe('[Ledigt 100%]');
  });

  it('should calculate correct free percentage for 0.5 usage', () => {
    expect(formatMemoryIndicator(0.5)).toBe('[Ledigt 50%]');
  });

  it('should calculate correct free percentage for 1 usage', () => {
    expect(formatMemoryIndicator(1)).toBe('[Ledigt 0%]');
  });

  it('should clamp values outside of 0-1 range', () => {
    expect(formatMemoryIndicator(-0.1)).toBe('[Ledigt 100%]');
    expect(formatMemoryIndicator(1.1)).toBe('[Ledigt 0%]');
  });
});
