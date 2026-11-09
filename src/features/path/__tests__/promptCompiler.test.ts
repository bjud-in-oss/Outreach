import { describe, test, expect } from 'vitest';
import {
  kompileraPrompt,
  skapaStegExekverare,
  skapaMockSessionAdapter,
  PromptCompileInput,
  PathPhase
} from '..';

describe('TCK-041: Promptkompilator och Körtidsadaptrar', () => {
  
  test('Testfall 1: kompileraPrompt genererar distinkta instruktioner och rimlig token-storlek', () => {
    const inputAvsikt: PromptCompileInput = {
      fas: 'avsikt',
      stegId: 'steg-1',
      ticketId: 'TCK-041',
      malDoman: 'path',
      uppdrag: 'Implementera promptkompilator'
    };

    const inputProvning: PromptCompileInput = {
      fas: 'provning',
      stegId: 'steg-2',
      ticketId: 'TCK-041',
      malDoman: 'path',
      uppdrag: 'Utvärdera resiliens'
    };

    const resultAvsikt = kompileraPrompt(inputAvsikt);
    const resultProvning = kompileraPrompt(inputProvning);

    // Verifiera att instruktionerna är olika för olika faser
    expect(resultAvsikt.systemInstruction).not.toEqual(resultProvning.systemInstruction);
    
    // Verifiera att token-beräkningen är under gränsen
    expect(resultAvsikt.beraknadeTokensUngefar).toBeLessThan(2000);
    expect(resultProvning.beraknadeTokensUngefar).toBeLessThan(2000);
    
    // Verifiera grundläggande struktur
    expect(resultAvsikt).toHaveProperty('userPrompt');
    expect(resultProvning).toHaveProperty('userPrompt');
  });

  test('Testfall 2: skapaStegExekverare hanterar lyckat svar från adapter', async () => {
    const mockSvar = '{"status": "godkand"}';
    const adapter = skapaMockSessionAdapter({ 'steg-1': mockSvar });
    const exekverare = skapaStegExekverare(adapter, 'path');

    const result = await exekverare('steg-1', {});

    expect(result.success).toBe(true);
    expect(result.data).toBe(mockSvar);
  });

  test('Testfall 3: skapaStegExekverare hanterar fel/avbrott från adapter', async () => {
    // Simulera ett fel genom att inte ge ett svar i tabellen eller kasta
    const adapter = skapaMockSessionAdapter({});
    const exekverare = skapaStegExekverare(adapter, 'path');

    // Eftersom nyckeln saknas förväntas exekveraren returnera success: false
    const result = await exekverare('saknat-steg', {});

    expect(result.success).toBe(false);
  });
});
