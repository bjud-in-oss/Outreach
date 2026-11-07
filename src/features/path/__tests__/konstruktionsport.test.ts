import { describe, it, expect } from 'vitest';
import { skapaKonstruktionsport, knackaPaPorten, PortNekadError } from '../index';
import { Port, PathContext } from '../model/types';

describe('konstruktionsport', () => {
  it('skall öppna porten när alla filer uppfyller kraven', async () => {
    const mockInspekterare = async (krav: any) => {
      return { existerar: true, antalRader: 50, exporteradIIndex: true };
    };

    const port = skapaKonstruktionsport({
      matris: [{ filVag: 'src/features/path/index.ts', maxRader: 250, kravsExport: true }],
      inspekterare: mockInspekterare,
      barrelVag: 'src/features/path/index.ts'
    });

    const kontext: PathContext = {};
    const resultat = await knackaPaPorten(port, kontext);
    expect(resultat.oppnad).toBe(true);
  });

  it('skall kasta PortNekadError när en fil saknas', async () => {
    const mockInspekterare = async (krav: any) => {
      if (krav.filVag === 'saknad.ts') {
        return { existerar: false, antalRader: 0, exporteradIIndex: false };
      }
      return { existerar: true, antalRader: 10, exporteradIIndex: true };
    };

    const port = skapaKonstruktionsport({
      matris: [{ filVag: 'saknad.ts', maxRader: 250, kravsExport: false }],
      inspekterare: mockInspekterare,
    });

    const kontext: PathContext = {};
    await expect(knackaPaPorten(port, kontext)).rejects.toThrow(PortNekadError);
  });

  it('skall kasta PortNekadError när radgräns överskrids', async () => {
    const mockInspekterare = async (krav: any) => {
      return { existerar: true, antalRader: 300, exporteradIIndex: true };
    };

    const port = skapaKonstruktionsport({
      matris: [{ filVag: 'storFil.ts', maxRader: 250, kravsExport: false }],
      inspekterare: mockInspekterare,
    });

    const kontext: PathContext = {};
    try {
      await knackaPaPorten(port, kontext);
      throw new Error('Skulle ha kastat PortNekadError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(PortNekadError);
      expect(error.omvandelseKrav).toBe('MODULÄR_EXPANSION');
    }
  });

  it('skall kasta PortNekadError när export saknas', async () => {
    const mockInspekterare = async (krav: any) => {
      return { existerar: true, antalRader: 50, exporteradIIndex: false };
    };

    const port = skapaKonstruktionsport({
      matris: [{ filVag: 'ejExporterad.ts', maxRader: 250, kravsExport: true }],
      inspekterare: mockInspekterare,
      barrelVag: 'index.ts'
    });

    const kontext: PathContext = {};
    try {
      await knackaPaPorten(port, kontext);
      throw new Error('Skulle ha kastat PortNekadError');
    } catch (error: any) {
      expect(error).toBeInstanceOf(PortNekadError);
      expect(error.omvandelseKrav).toBe('UPPDATERA_INDEX');
    }
  });
});
