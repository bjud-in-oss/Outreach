import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnifiedPromptBar } from '../features/gemini_live_swarm/ui/UnifiedPromptBar';
import React from 'react';

describe('UnifiedPromptBar Memory Indicator (TCK-034)', () => {
  it('should render the memory indicator with free percentage', () => {
    // Rendera komponenten. Initialt saknas minnesindikatorn varför detta test förväntas fallera.
    render(<UnifiedPromptBar />);
    
    // Sök efter textfragmentet för minnesindikatorn som skall finnas i gränssnittet
    const memoryIndicator = screen.getByText(/\[Ledigt \d+%\]/i);
    
    expect(memoryIndicator).toBeInTheDocument();
  });
});
