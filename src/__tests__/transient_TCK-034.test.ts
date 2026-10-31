import { describe, it, expect, vi } from 'vitest';
import { getGlobalSwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';

describe('TCK-034 Functional Alibi Test', () => {
  it('should process events functionally through the bus', async () => {
    const eventBus = getGlobalSwarmEventBus();
    const handler = vi.fn();
    
    eventBus.subscribe('swarm_intent_toggled', handler);
    
    eventBus.emit('swarm_intent_toggled', { 
      intent: 'research', 
      active: true,
      agentId: 'test-agent' 
    });
    
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      intent: 'research',
      active: true
    }));
  });
});
