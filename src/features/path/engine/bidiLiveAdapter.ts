import { BidiLiveAdapterConfig, SessionAdapter } from '../model/types';
import { CompiledPrompt } from '../contracts/pathSchema';
import { GoogleGenAI } from '@google/genai';

export function skapaBidiLiveAdapter(
  config: Partial<BidiLiveAdapterConfig> & { clientFactory?: any; sdkConstructor?: any },
  explicitClientFactory?: any
): SessionAdapter {
  const eventBus = config.eventBus;
  const clientFactory = config.clientFactory || explicitClientFactory;

  return {
    async skicka(prompt: CompiledPrompt): Promise<{ svar: string; tokensAnvanda?: number }> {
      let svar = '';
      let tokensAnvanda = 0;

      if (clientFactory) {
        const client = await clientFactory();
        try {
          if (typeof client.connect === 'function') {
            await client.connect();
          }

          const instruction = prompt.systemPrompt || prompt.systemInstruction || prompt.instructions || '';
          const content = prompt.userPrompt || prompt.renderedContent || '';

          if (typeof client.send === 'function') {
            await client.send({ instruction, content });
          } else if (typeof client.sendPrompt === 'function') {
            await client.sendPrompt({ instruction, content });
          }

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
      } else {
        const apiKey = config.apiKey;
        if (!apiKey) {
          throw new Error('API-nyckel saknas för Gemini Live SDK');
        }

        const SdkClass = config.sdkConstructor || GoogleGenAI;
        const ai = new SdkClass({ apiKey, apiVersion: 'v1alpha' });
        
        const content = prompt.userPrompt || prompt.renderedContent || '';

        try {
          const session = await ai.live.connect({ model: config.model || 'gemini-3.8-live' });
          try {
            await session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: content }] }],
              turnComplete: true
            });

            for await (const message of session.receiveStream()) {
              const serverContent = message.serverContent;
              if (serverContent && serverContent.modelTurn && serverContent.modelTurn.parts) {
                for (const part of serverContent.modelTurn.parts) {
                  if (part.text) {
                    svar +=part.text;
                  }
                }
              }
            }
          } catch (err) {
            if (eventBus && typeof eventBus.emit === 'function') {
              eventBus.emit('error', err);
            }
            throw err;
          } finally {
            await session.close();
          }
        } catch (err) {
          if (eventBus && typeof eventBus.emit === 'function') {
            eventBus.emit('error', err);
          }
          throw err;
        }
      }

      return { svar, tokensAnvanda };
    },
  };
}
