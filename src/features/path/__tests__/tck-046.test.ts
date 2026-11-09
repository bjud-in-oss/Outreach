import { describe, it, expect, vi } from 'vitest';
import { bestamFasForSteg } from '../engine/pathRunner';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';
import type { CompiledPrompt } from '../contracts/pathSchema';

describe('TCK-046 transient tests', () => {
  describe('bestamFasForSteg', () => {
    it('ska ge korrekt fas för portnoder', () => {
      expect(bestamFasForSteg('p2')).toBe('provning');
      expect(bestamFasForSteg('port-konstruktion')).toBe('konstruktion');
      expect(bestamFasForSteg('p1')).toBe('avsikt');
      expect(bestamFasForSteg('p4')).toBe('besiktning');
    });
  });

  describe('bidiLiveAdapter polyglott prompt', () => {
    it('ska skicka instruction och content till klienten via körtidsankare', async () => {
      const sentMessages: any[] = [];
      let connected = false;
      let closed = false;

      const mockClient = {
        connect: async () => { connected = true; },
        send: async (msg: any) => { sentMessages.push(msg); },
        close: async () => { closed = true; },
        stream: (async function* () {
          yield { text: 'svar från AI', usage: 10 };
        })()
      };
      
      const clientFactory = () => mockClient;
      const adapter = skapaBidiLiveAdapter({}, clientFactory);
      
      const prompt: CompiledPrompt = {
        instructions: 'Du är en guide.',
        renderedContent: 'Vart ska vi gå?',
      };

      const result = await adapter.skicka(prompt);

      expect(connected).toBe(true);
      expect(closed).toBe(true);
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toEqual({
        instruction: 'Du är en guide.',
        content: 'Vart ska vi gå?',
      });
      expect(result).toEqual({ svar: 'svar från AI', tokensAnvanda: 10 });
    });
  });
});
