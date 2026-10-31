import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnifiedPromptBar } from '../features/gemini_live_swarm/ui/UnifiedPromptBar';
import React from 'react';

describe('UnifiedPromptBar - TCK-034 Memory Indicator', () => {
  it('should render the memory indicator in the prompt bar', () => {
    render(<UnifiedPromptBar />);
    
    // Förvänta oss att texten "[Ledigt" eller den förväntade indikatorn finns i dokumentet
    const memoryIndicator = screen.getByText(/\[Ledigt/i);
    expect(memoryIndicator).toBeDefined();
  });

  it('should display default state when usage ratio is undefined', () => {
    render(<UnifiedPromptBar />);
    
    const memoryIndicator = screen.getByText(/\[Ledigt --%\]/i);
    expect(memoryIndicator.textContent).toBe('[Ledigt --%]');
  });
});
