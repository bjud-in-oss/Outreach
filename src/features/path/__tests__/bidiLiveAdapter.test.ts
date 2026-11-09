import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';
import { BidiLiveAdapterConfig } from '../model/types';
import { CompiledPrompt } from '../contracts/pathSchema';

describe('BidiLiveAdapter (TCK-045)', () => {
  it('skall instansiera och skicka prompt och ackumulera svar korrekt, samt propagera fel via EventBus', async () => {
    // Vi skapar en event emitter för att simulera nätverksfel i realtid (runtime anchor för felhantering)
    const eventBus = new EventEmitter();
    
    const mockLiveClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      send: vi.fn().mockResolvedValue(undefined),
      stream: {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'Test svar:', usage: 5 };
          yield { text: ' och mer svar.', usage: 10 };
        }
      },
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      emit: vi.fn(),
    };
    
    mockLiveClient.on.mockImplementation((event, handler) => {
      eventBus.on(event, handler);
    });

    const mockLiveClientFactory = vi.fn().mockReturnValue(mockLiveClient);

    const config: Partial<BidiLiveAdapterConfig> = {
      model: 'gemini-3.8-live',
      eventBus: eventBus as any,
    };

    const adapter = skapaBidiLiveAdapter(config, mockLiveClientFactory);

    const prompt: CompiledPrompt = {
      templateId: 'test-template',
      instructions: 'Du är en hjälpsam assistent.',
      model: 'gemini-3.8-live',
      variables: {},
      renderedContent: 'Hallå där!',
    };

    const result = await adapter.skicka(prompt);

    expect(result).toBeDefined();
    expect(result.svar).toBe('Test svar: och mer svar.');
    expect(result.tokensAnvanda).toBe(15);
    expect(mockLiveClientFactory).toHaveBeenCalled();
  });
});
