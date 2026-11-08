import { describe, it, expect } from 'vitest';
import { exekveraRecept, skapaClassicRecept, PortNekadError } from '..';
import { Port } from '../model/types';

describe('transient_TCK-040: Classic 12-Step Recipe', () => {
  const mockGodkand: Port = async () => ({ oppnad: true });
  const mockNekad: Port = async () => ({
    oppnad: false,
    orsak: 'Testfel',
    omvandelseKrav: 'ÅTGÄRDA',
  });

  it('skall fullfölja exekveraRecept nÃ¤r alla portar Ã¤r godkÃ¤nda', async () => {
    const recipe = skapaClassicRecept({
      avsikt: mockGodkand,
      provning: mockGodkand,
      konstruktion: mockGodkand,
      besiktning: mockGodkand,
    });

    const resultat = await exekveraRecept(recipe, {});
    expect(resultat.success).toBe(true);
  });

  it('skall avbryta och kasta PortNekadError nÃ¤r provning nekas', async () => {
    const recipe = skapaClassicRecept({
      avsikt: mockGodkand,
      provning: mockNekad,
      konstruktion: mockGodkand,
      besiktning: mockGodkand,
    });

    await expect(exekveraRecept(recipe, {})).rejects.toThrow(PortNekadError);
  });

  it('skall avbryta med Error nÃ¤r stegExekverare misslyckas pÃ¥ step-1b', async () => {
    const recipe = skapaClassicRecept({
      avsikt: mockGodkand,
      provning: mockGodkand,
      konstruktion: mockGodkand,
      besiktning: mockGodkand,
      stegExekverare: async (stegId) => {
        if (stegId === 'step-1b') {
          return { success: false };
        }
        return { success: true };
      },
    });

    await expect(exekveraRecept(recipe, {})).rejects.toThrow();
  });
});
