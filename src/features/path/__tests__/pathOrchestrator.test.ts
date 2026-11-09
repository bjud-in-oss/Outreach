import { describe, it, expect } from 'vitest';
import { 
  bestamFasForSteg, 
  skapaStegExekverare, 
  skapaMockSessionAdapter,
  exekveraRecept,
  PathRecipe,
  SwarmAgentRole
} from '..';

describe('TCK-043: Den Integrerade Recept-Orkestreraren', () => {
  
  describe('bestamFasForSteg', () => {
    it('ska mappa steg korrekt till deras faser', () => {
      // Fas: avsikt
      expect(bestamFasForSteg('step-1a')).toBe('avsikt');
      expect(bestamFasForSteg('step-0a')).toBe('avsikt');
      expect(bestamFasForSteg('step-0b')).toBe('avsikt');
      expect(bestamFasForSteg('avsikt')).toBe('avsikt');

      // Fas: provning
      expect(bestamFasForSteg('step-1b')).toBe('provning');
      expect(bestamFasForSteg('step-2')).toBe('provning');
      expect(bestamFasForSteg('step-3')).toBe('provning');
      expect(bestamFasForSteg('provning')).toBe('provning');

      // Fas: konstruktion
      expect(bestamFasForSteg('step-fas2')).toBe('konstruktion');
      expect(bestamFasForSteg('konstruktion')).toBe('konstruktion');

      // Fas: besiktning
      expect(bestamFasForSteg('step-fas3')).toBe('besiktning');
      expect(bestamFasForSteg('besiktning')).toBe('besiktning');
    });
  });

  describe('skapaStegExekverare', () => {
    it('ska integrera med kompileraPrompt och skicka till adapter', async () => {
      const mockAdapter = skapaMockSessionAdapter({
        'StegId: step-1a\nInput: {}': 'test svar'
      });

      const stegExekverare = skapaStegExekverare(mockAdapter, 'path');
      const result = await stegExekverare('step-1a', {});

      expect(result.success).toBe(true);
      expect(result.data).toBe('test svar');
    });
  });

  describe('exekveraRecept', () => {
    it('ska exekvera noder i receptet sekventiellt', async () => {
      let visitedNodes = 0;
      
      const mockPort = async () => ({ oppnad: true });
      const mockStep = async () => {
        visitedNodes++;
        return { success: true };
      };

      const recipe: PathRecipe = {
        name: 'Test Recept',
        version: '1.0',
        nodes: [
          { type: 'PORT', id: 'port1', port: mockPort },
          { type: 'STEP', id: 'step1', execute: mockStep },
          { type: 'PORT', id: 'port2', port: mockPort },
          { type: 'STEP', id: 'step2', execute: mockStep }
        ]
      };

      const result = await exekveraRecept(recipe, {});

      expect(result.success).toBe(true);
      expect(result.slutfold).toBe(true);
      expect(visitedNodes).toBe(2);
    });
  });
});
