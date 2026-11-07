import { describe, it, expect } from 'vitest';
import { 
  skapaProvningsport, 
  knackaPaPorten, 
  PortNekadError, 
  Port, 
  PathContext 
} from '..';

describe('Prövningsporten (TCK-037)', () => {

  it('Testfall 1: Godkänt prediktivt rött test', async () => {
    const testExekverare = async (testFilVag: string) => {
      return { 
        passerade: false, 
        exitKod: 1, 
        felmeddelande: 'AssertionError: expected false to be true' 
      };
    };

    const port = skapaProvningsport({
      testFilVag: 'dummy.test.ts',
      forvantatFel: 'AssertionError',
      testExekverare
    });

    const kontext: PathContext = {};
    const resultat = await knackaPaPorten(port, kontext);
    
    expect(resultat.oppnad).toBe(true);
  });

  it('Testfall 2: Underkänt p.g.a. grönt test', async () => {
    const testExekverare = async (testFilVag: string) => {
      return { 
        passerade: true, 
        exitKod: 0 
      };
    };

    const port = skapaProvningsport({
      testFilVag: 'dummy.test.ts',
      forvantatFel: 'AssertionError',
      testExekverare
    });

    const kontext: PathContext = {};
    
    await expect(knackaPaPorten(port, kontext)).rejects.toThrow(PortNekadError);
  });

  it('Testfall 3: Underkänt p.g.a. syntax-/importfel', async () => {
    const testExekverare = async (testFilVag: string) => {
      return { 
        passerade: false, 
        exitKod: 1, 
        felmeddelande: 'SyntaxError: Unexpected token' 
      };
    };

    const port = skapaProvningsport({
      testFilVag: 'dummy.test.ts',
      forvantatFel: 'AssertionError',
      testExekverare
    });

    const kontext: PathContext = {};
    
    await expect(knackaPaPorten(port, kontext)).rejects.toThrow(PortNekadError);
  });
});
