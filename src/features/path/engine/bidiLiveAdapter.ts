import { BidiLiveAdapterConfig, SessionAdapter } from '../model/types';
import { CompiledPrompt } from '../contracts/pathSchema';

export function skapaBidiLiveAdapter(
  config: Partial<BidiLiveAdapterConfig> & { clientFactory?: any },
  explicitClientFactory?: any
): SessionAdapter {
  const eventBus = config.eventBus;
  const clientFactory = config.clientFactory || explicitClientFactory;

  return {
    async skicka(prompt: CompiledPrompt): Promise<{ svar: string; tokensAnvanda?: number }> {
      // Defensiv fallback om ingen factory injiceras
      const client = clientFactory ? await clientFactory() : {
        connect: async () => {},
        send: async () => {},
        close: async () => {}
      };

      let svar = '';
      let tokensAnvanda = 0;

      try {
        // 1. Polyglott connect
        if (typeof client.connect === 'function') {
          await client.connect();
        }

        // 2. Polyglott prompt-sändning (stödjer både send och sendPrompt)
        const instruction = prompt.systemPrompt || prompt.systemInstruction || prompt.instructions || '';
        const content = prompt.userPrompt || prompt.renderedContent || '';

        if (typeof client.send === 'function') {
          await client.send({ instruction, content });
        } else if (typeof client.sendPrompt === 'function') {
          await client.sendPrompt({ instruction, content });
        }

        // 3. Polyglott strömhantering (stödjer både client.stream och client.receiveStream())
        const streamSource = client.stream 
          ? client.stream 
          : (typeof client.receiveStream === 'function' ? client.receiveStream() : null);

        if (streamSource) {
          for await (const chunk of streamSource) {
            if (chunk.text) {
              svar += chunk.text;
            }
            if (chunk.usage) {
              tokensAnvanda += chunk.usage;
            }
          }
        }
      } catch (err) {
        if (eventBus && typeof eventBus.emit === 'function') {
          eventBus.emit('error', err);
        }
        throw err;
      } finally {
        if (typeof client.close === 'function') {
          await client.close();
        }
      }

      return { svar, tokensAnvanda };
    },
  };
}
