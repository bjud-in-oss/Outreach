import { describe, it, expect } from 'vitest';
import { kompileraPrompt } from '../engine/promptCompiler';
import { PromptCompileInput } from '../contracts/pathSchema';

describe('kompileraPrompt - TCK-048', () => {
  it('skall inkludera domänspecifika typdefinitioner i systeminstruktionen vid konstruktionsfas', () => {
    const input: PromptCompileInput = {
      fas: 'konstruktion',
      uppdrag: 'Utvärdera arkitektonisk resiliens',
      konstextMinne: [
        {
          typ: 'systemisk_invariant',
          innehåll: 'Max 1 FSD-domän får modifieras per cykel.',
          kalltidsStamplar: new Date().toISOString()
        }
      ],
      doman: 'path'
    } as any;

    const resultat = kompileraPrompt(input);

    expect(resultat).toBeDefined();
    expect(resultat.systemInstruction).toContain('Max 1 FSD-domän får modifieras per cykel.');
    expect(resultat.systemInstruction).toContain('Typkontrakt och systemiska invarianter');
  });

  it('skall kasta Zod-valideringsfel vid ogiltig fas', () => {
    const ogiltigInput = {
      fas: 'ogiltig_fas',
      uppdrag: 'Testa felhantering',
      doman: 'path'
    } as any;

    expect(() => kompileraPrompt(ogiltigInput)).toThrow();
  });
});
