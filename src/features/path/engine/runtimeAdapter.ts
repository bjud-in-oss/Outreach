import { SessionAdapter, CompiledPrompt, StepResult } from '../model/types';

export function skapaMockSessionAdapter(svarstabell: Record<string, string> = {}): SessionAdapter {
  return {
    skicka: async (prompt: CompiledPrompt) => {
      const stegIdMatch = prompt.userPrompt.match(/StegId: ([^\n]+)/);
      const stegId = stegIdMatch ? stegIdMatch[1] : '';
      
      const svar = svarstabell[stegId] || svarstabell[prompt.userPrompt] || '';
      
      return { svar };
    }
  };
}

export function skapaStegExekverare(adapter: SessionAdapter, doman: string) {
  return async (stegId: string, input: Record<string, unknown>): Promise<StepResult> => {
    const prompt: CompiledPrompt = {
      systemInstruction: 'Exekverar steg.',
      userPrompt: `StegId: ${stegId}\nInput: ${JSON.stringify(input)}`,
      beraknadeTokensUngefar: 50
    };

    try {
      const result = await adapter.skicka(prompt);
      if (result.svar) {
        return { success: true, data: result.svar };
      }
      return { success: false, data: 'Inget svar erhölls' };
    } catch (error) {
      return { success: false, data: error instanceof Error ? error.message : 'Okänt fel' };
    }
  };
}
