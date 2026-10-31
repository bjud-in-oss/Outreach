import { describe, it, expect, vi } from 'vitest';
import { FloorController } from '../features/gemini_live_swarm/session/floorController';
import { SwarmEventBus } from '../features/gemini_live_swarm/bus/swarmEventBus';

describe('TCK-034 FloorController Alibi Test', () => {
  it('should instantiate and emit events functionally', () => {
    const eventBus = new SwarmEventBus();
    const controller = new FloorController(eventBus);
    
    const emitSpy = vi.spyOn(eventBus, 'emit');
    
    // Trigger a functional change in state
    controller.requestFloor('agent_1');
    
    expect(emitSpy).toHaveBeenCalled();
  });
});
