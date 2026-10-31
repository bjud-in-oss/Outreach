import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../features/gemini_live_swarm/ui/promptBarHelper';

describe('TCK-034: Minnesindikator i Promptfältet', () => {
  it('skall formatera minnesanvändning korrekt', () => {
    // Verifiera att funktionen finns och returnerar förväntat format
    expect(formatMemoryIndicator(undefined)).toBe('[Ledigt --%]');
    expect(formatMemoryIndicator(0)).toBe('[Ledigt 100%]');
    expect(formatMemoryIndicator(0.5)).toBe('[Ledigt 50%]');
    expect(formatMemoryIndicator(1)).toBe('[Ledigt 0%]');
    expect(formatMemoryIndicator(0.156)).toBe('[Ledigt 84%]');
  });
});
