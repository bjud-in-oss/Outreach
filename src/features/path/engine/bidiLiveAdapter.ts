import { BidiLiveAdapterConfig } from '../model/types';
import { CompiledPrompt } from '../contracts/pathSchema';
import { SessionAdapter } from '../model/types';

export function skapaBidiLiveAdapter(
  config: Partial<BidiLiveAdapterConfig>,
  clientFactory?: any
): SessionAdapter {
  const model = config.model || 'gemini-3.8-live';
  const eventBus = config.eventBus;

  return {
    async skicka(prompt: CompiledPrompt): Promise<{ svar: string; tokensAnvanda?: number }> {
      // Skapa klient via factory (eller mock i test)
      const client = clientFactory ? clientFactory() : {};

      if (typeof client.connect === 'function') {
        await client.connect();
      }

      if (typeof client.send === 'function') {
        await client.send({
          instruction: prompt.instructions,
          content: prompt.renderedContent,
        });
      }

      let svar = '';
      let tokensAnvanda = 0;

      if (client.stream) {
        for await (const chunk of client.stream) {
          if (chunk.text) {
            svar += chunk.text;
          }
          if (chunk.usage) {
            tokensAnvanda += chunk.usage;
          }
        }
      }

      if (typeof client.close === 'function') {
        await client.close();
      }

      return { svar, tokensAnvanda };
    },
  };
}
