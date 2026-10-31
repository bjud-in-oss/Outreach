import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { UnifiedPromptBar } from '../features/gemini_live_swarm/ui/UnifiedPromptBar';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';
import { SwarmProvider } from '../features/gemini_live_swarm/context/SwarmContext';

describe('UnifiedPromptBar - Memory Indicator (TCK-034)', () => {
  let eventBus: SwarmEventBus;

  beforeEach(() => {
    eventBus = new SwarmEventBus();
    eventBus.clear();
  });

  it('initially displays default memory indicator when no telemetry has been received', () => {
    render(
      <SwarmProvider>
        <UnifiedPromptBar />
      </SwarmProvider>
    );

    const indicator = screen.getByText(/\[Ledigt --%\]/i);
    expect(indicator).toBeDefined();
  });

  it('updates memory indicator when telemetry updates context usage', () => {
    render(
      <SwarmProvider>
        <UnifiedPromptBar />
      </SwarmProvider>
    );
    
    // Initial state
    expect(screen.getByText(/\[Ledigt --%\]/i)).toBeDefined();

    // Trigger telemetry event through the event bus
    // Assuming the orchestrator or provider listens to telemetry updates
    eventBus.emit('telemetry:usage', { usageRatio: 0.25 });

    // After update, it should display 75% free
    const updatedIndicator = screen.getByText(/\[Ledigt 75%\]/i);
    expect(updatedIndicator).toBeDefined();
  });
});