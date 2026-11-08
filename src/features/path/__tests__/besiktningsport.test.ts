import { describe, it, expect } from 'vitest';
import { knackaPaPorten, exekveraRecept, PortNekadError } from '..';
import { skapaBesiktningsport } from '../engine/besiktningsport';
import { skapaLeanRecept } from '../recipes/leanRecipe';
import { PathContext, Port } from '../model/types';

describe('TCK-039 Besiktningsporten och Recept-harmonisering', () => {
  it('skall öppna porten vid godkänd besiktning', async () => {
    const mockKontext: PathContext = {};
    const besiktningsport = skapaBesiktningsport({
      inspekterare: async (kontext: PathContext) => {
        return { godkand: true };
      }
    });

    const resultat = await knackaPaPorten(besiktningsport, mockKontext);
    expect(resultat.oppnad).toBe(true);
  });

  it('skall kasta PortNekadError vid underkänd besiktning', async () => {
    const mockKontext: PathContext = {};
    const besiktningsport = skapaBesiktningsport({
      inspekterare: async (kontext: PathContext) => {
        return { godkand: false, felmeddelande: 'Bristande insikt' };
      }
    });

    await expect(knackaPaPorten(besiktningsport, mockKontext)).rejects.toThrow(PortNekadError);
  });

  it('skall exekvera Lean Recept med 4 portar', async () => {
    const mockKontext: PathContext = {};
    
    // Skapa enkla mock-portar för de tre första stegen
    const mockPort: Port = async (kontext: PathContext) => ({ oppnad: true });
    
    const avsikt = mockPort;
    const provning = mockPort;
    const konstruktion = mockPort;
    
    const besiktning = skapaBesiktningsport({
      inspekterare: async (kontext: PathContext) => ({ godkand: true })
    });

    const recept = skapaLeanRecept({ avsikt, provning, konstruktion, besiktning });
    const resultat = await exekveraRecept(recept, mockKontext);

    expect(resultat.sucess).toBe(true);
  });
});
