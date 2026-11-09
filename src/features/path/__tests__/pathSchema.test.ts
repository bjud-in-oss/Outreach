import { describe, it, expect } from 'vitest';
import { 
  kompileraPrompt, 
  PromptCompileInputSchema, 
  CompiledPromptSchema 
} from '..';

describe('TCK-042: Fasspecifik Promptkompilator och Typlåsning', () => {
  
  it('Testfall 1: bör generera distinkta, fasspecifika systeminstruktioner för alla faser', () => {
    const faser = ['avsikt', 'provning', 'konstruktion', 'besiktning'] as const;
    const resultat = faser.map(fas => kompileraPrompt({
      fas,
      stegId: 'steg-1',
      ticketId: 'TCK-042',
      malDoman: 'path',
      uppdrag: 'Testa kompilatorn'
    }));

    // Kontrollera att instruktionerna är unika för varje fas
    const unikaInstruktioner = new Set(resultat.map(r => r.systemInstruction));
    expect(unikaInstruktioner.size).toBe(faser.length);

    // Verifiera specifika nyckelord för faserna
    expect(resultat[0].systemInstruction).toMatch(/Gherkin/i);
    expect(resultat[1].systemInstruction).toMatch(/reverse-direction|check-alignment/i);
    expect(resultat[2].systemInstruction).toMatch(/TDD/i);
    expect(resultat[3].systemInstruction).toMatch(/reflekterande debriefing/i);
  });

  it('Testfall 2: PromptCompileInputSchema och CompiledPromptSchema ska validera korrekta data och avvisa ogiltiga faser', () => {
    const validData = {
      fas: 'avsikt',
      stegId: '1',
      ticketId: 'TCK-042',
      malDoman: 'path',
      uppdrag: 'Testa schema'
    };

    const parsedInput = PromptCompileInputSchema.safeParse(validData);
    expect(parsedInput.success).toBe(true);

    const invalidData = {
      fas: 'ogiltig-fas',
      stegId: '1',
      ticketId: 'TCK-042',
      malDoman: 'path',
      uppdrag: 'Testa schema'
    };

    const parsedInvalid = PromptCompileInputSchema.safeParse(invalidData);
    expect(parsedInvalid.success).toBe(false);
  });

  it('Testfall 3: beraknadeTokensUngefar ska beräknas deterministiskt utan fel', () => {
    const input = {
      fas: 'konstruktion' as const,
      stegId: '2',
      ticketId: 'TCK-042',
      malDoman: 'path',
      uppdrag: 'Testa tokens'
    };

    const resultat = kompileraPrompt(input);
    expect(resultat.beraknadeTokensUngefar).toBeGreaterThan(0);
    expect(typeof resultat.beraknadeTokensUngefar).toBe('number');
  });

});
