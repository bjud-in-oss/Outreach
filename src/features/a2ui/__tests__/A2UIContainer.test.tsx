import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { A2UIContainer } from '../engine/A2UIContainer';
import { SwarmEventBus } from '../../../shared/bus/swarmEventBus';

describe('A2UIContainer', () => {
  let eventBus: SwarmEventBus;

  beforeEach(() => {
    eventBus = new SwarmEventBus();
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('initially renders nothing (null)', () => {
    const { container } = render(<A2UIContainer bus={eventBus} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ListeningCard when a2ui:render event is received', async () => {
    const { container } = render(<A2UIContainer bus={eventBus} />);
    
    // Initial state check
    expect(container.firstChild).toBeNull();

    // Act: Publish render event
    act(() => {
      eventBus.publish('a2ui:render', { 
        componentId: 'ListeningCard', 
        dataModel: { intent: 'Lyssnar på användaren' } 
      });
    });

    // Assert: ListeningCard should be rendered
    // Note: ListeningCard should have text or a known test ID, expecting it to be visible
    expect(screen.getByText(/lyssnar på användaren/i)).toBeDefined();
  });

  it('clears content when a2ui:clear event is received', async () => {
    const { container } = render(<A2UIContainer bus={eventBus} />);

    // Act: Render something
    act(() => {
      eventBus.publish('a2ui:render', { 
        componentId: 'ListeningCard', 
        dataModel: { intent: 'Lyssnar på användaren' } 
      });
    });

    expect(screen.getByText(/lyssnar på användaren/i)).toBeDefined();

    // Act: Clear
    act(() => {
      eventBus.publish('a2ui:clear', undefined);
    });

    // Assert: Back to null
    expect(container.firstChild).toBeNull();
  });
});
