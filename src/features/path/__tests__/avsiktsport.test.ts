import { describe, it, expect, vi } from 'vitest';
import {
  skapaAvsiktsport,
  exekveraRecept,
  PortNekadError,
  knackaPaPorten,
  PathRecipe,
  PathContext
} from '..';

describe('TCK-036: Avsiktsporten och Recept-exekvering', () => {
  
  describe('Avsiktsporten', () => {
    it('ska öppna porten vid bekräftelse (Enter eller ja)', async () => {
                  
      const prompter = vi.fn().mockResolvedValue('ja');
      const port = skapaAvsiktsport({ prompter, beskrivning: 'Vill du fortsätta?' });
      const kontext: PathContext = {};
      
      const resultat = await knackaPaPorten(port, kontext);
      expect(resultat.oppnad).toBe(true);
          });

    it('ska kasta PortNekadError med AVBRYT vid stoppord', async () => {
      const prompter = vi.fn().mockResolvedValue('nej');
      const port = skapaAvsiktsport({ prompter, beskrivning: 'Vill du fortsätta?' });
      const kontext: PathContext = {};

      try {
        await knackaPaPorten(port, kontext);
        throw new Error('Skulle ha kastat PortNekadError');
      } catch (e: any) {
        expect(e).toBeInstanceOf(PortNekadError);
        expect(e.omvandelseKrav).toBe('AVBRYT');
      }
    });

    it('ska kasta PortNekadError med SAMRÅD och bevara text vid dialogfråga', async () => {
      const fraga = 'vad innebär detta?';
      const prompter = vi.fn().mockResolvedValue(fraga);
      const port = skapaAvsiktsport({ prompter, beskrivning: 'Vill du fortsätta?' });
      const kontext: PathContext = {};

      try {
        await knackaPaPorten(port, kontext);
        throw new Error('Skulle ha kastat PortNekadError');
      } catch (e: any) {
        expect(e).toBeInstanceOf(PortNekadError);
        expect(e.omvandelseKrav).toBe('SAMRÅD');
        expect(e.orsak).toContain(fraga);
      }
    });
  });

  describe('Recept-exekveraren', () => {
    it('ska exekvera noder sekventiellt', async () => {
      const step1Executed = vi.fn().mockResolvedValue({ success: true });
      const step2Executed = vi.fn().mockResolvedValue({ success: true });
      
      const recipe: PathRecipe = {
        id: 'test-recipe',
        name: 'Test Recept',
        description: 'Ett recept för test',
        nodes: [
          { id: 'step1', name: 'Steg 1', type: 'STEP', execute: step1Executed },
          { id: 'step2', name: 'Steg 2', type: 'STEP', execute: step2Executed }
        ]
      };
      
      const kontext: PathContext = {};
      await exekveraRecept(recipe, kontext);
      
      expect(step1Executed).toHaveBeenCalledOnce();
      expect(step2Executed).toHaveBeenCalledOnce();
    });

    it('ska avbryta exekvering om ett steg misslyckas', async () => {
      const step1Executed = vi.fn().mockResolvedValue({ success: false });
      const step2Executed = vi.fn().mockResolvedValue({ success: true });
      
      const recipe: PathRecipe = {
        id: 'test-recipe',
        name: 'Test Recept',
        description: 'Ett recept för test',
        nodes: [
          { id: 'step1', name: 'Steg 1', type: 'STEP', execute: step1Executed },
          { id: 'step2', name: 'Steg 2', type: 'STEP', execute: step2Executed }
        ]
      };
      
      const kontext: PathContext = {};
      await expect(exekveraRecept(recipe, kontext)).rejects.toThrow();
      expect(step2Executed).not.toHaveBeenCalled();
    });
  });
});
