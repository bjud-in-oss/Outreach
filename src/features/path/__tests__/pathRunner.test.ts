import { describe, it, expect } from 'vitest';
import { knackaPaPorten } from '../engine/pathRunner';
import { Port, PathContext } from '../model/types';
import { PortNekadError } from '../engine/pathRunner';

describe('knackaPaPorten', () => {
  it('ska kasta PortNekadError om porten returnerar oppnad: false', async () => {
    const mockPort: Port = async (kontext: PathContext) => {
      return { oppnad: false, orsak: 'Ingen tillträde.' };
    };

    const mockKontext: PathContext = {
      biljettDatum: new Date().toISOString(),
      aktuellFas: 'initiering',
      minne: {}
    };

    await expect(knackaPaPorten(mockPort, mockKontext)).rejects.toThrow(PortNekadError);
  });
});
