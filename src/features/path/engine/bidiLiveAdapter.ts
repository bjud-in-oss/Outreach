import { BidiLiveAdapterConfig, SessionAdapter } from '../model/types';
import { CompiledPrompt } from '../contracts/pathSchema';
import { GoogleGenAI } from '@google/genai';

export function computeBackoffDelayMs(attempt: number, baseBackoffMs = 1000, maxJitterMs = 1000): number {
  return Math.pow(2, attempt + 1) * baseBackoffMs + (maxJitterMs > 0 ? Math.floor(Math.random() * maxJitterMs) : 0);
}

export function isTransientLiveError(err: unknown): boolean {
  if (!err) return false;
  const errStr = String(err);
  const code = (err as any).code;
  if (code && [1011, 1006, 503].includes(Number(code))) return true;
  return /\b(1011|1006|503)\b|handskakning|handshake|ECONNRESET|ETIMEDOUT/i.test(errStr);
}

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
        const maxRetries = config.maxReconnectAttempts !== undefined ? config.maxReconnectAttempts : 5;
        const maxAttempts = maxRetries + 1;
        let attempts = 0;

        while (attempts < maxAttempts) {
          attempts++;
          let session;
          try {
            session = await ai.live.connect({ model: config.model || 'gemini-3.8-live' });
            await session.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: content }] }],
              turnComplete: true
            });

            for await (const message of session.receiveStream()) {
              const serverContent = message.serverContent;
              if (serverContent && serverContent.modelTurn && serverContent.modelTurn.parts) {
                for (const part of serverContent.modelTurn.parts) {
                  if (part.text) {
                    svar += part.text;
                  }
                }
              }
            }
            break;
          } catch (err) {
            if (attempts >= maxAttempts || !isTransientLiveError(err)) {
              if (eventBus && typeof eventBus.emit === 'function') {
                eventBus.emit('error', err);
              }
              throw err;
            }
            const delay = computeBackoffDelayMs(attempts - 1, config.baseBackoffMs, config.maxJitterMs);
            await new Promise(resolve => setTimeout(resolve, delay));
          } finally {
            if (session) {
              await session.close();
            }
          }
        }
      }

      return { svar, tokensAnvanda };
    },
  };
}
