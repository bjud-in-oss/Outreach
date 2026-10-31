import { describe, it, expect } from 'vitest';
import { formatMemoryIndicator } from '../features/gemini_live_swarm/ui/promptBarHelper';
import { getGlobalSwarmEventBus } from '../shared/bus/swarmEventBus';

describe('TCK-034: Memory Indicator and EventBus Integration', () => {

  describe('formatMemoryIndicator', () => {
    it('should format the memory indicator correctly based on usage ratio', () => {
      expect(formatMemoryIndicator(0.1)).toBe('[Ledigt 90%]');
      expect(formatMemoryIndicator(0.5)).toBe('[Ledigt 50%]');
      expect(formatMemoryIndicator(0.99)).toBe('[Ledigt 1%]');
      expect(formatMemoryIndicator(0)).toBe('[Ledigt 100%]');
      expect(formatMemoryIndicator(1)).toBe('[Ledigt 0%]');
    });

    it('should handle undefined usage ratio gracefully', () => {
      expect(formatMemoryIndicator(undefined)).toBe('[Ledigt --%]');
    });

    it('should clamp values outside the 0-1 range', () => {
      expect(formatMemoryIndicator(-0.1)).toBe('[Ledigt 100%]');
      expect(formatMemoryIndicator(1.1)).toBe('[Ledigt 0%]');
    });
  });

  describe('EventBus Integration for Memory Updates', () => {
    it('should publish and subscribe to memory usage updates via SwarmEventBus', () => {
      const eventBus = getGlobalSwarmEventBus();
      let receivedRatio: number | null = null;

      const subscription = eventBus.subscribe('swarm:memory_update', (data: { usageRatio: number }) => {
        receivedRatio = data.usageRatio;
      });

      try {
        eventBus.publish('swarm:memory_update', { usageRatio: 0.25 });
        expect(receivedRatio).toBe(0.25);
      } finally {
        subscription.unsubscribe();
      }
    });
  });
});
