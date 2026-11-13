import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { BidiLiveAdapterConfigSchema } from '../contracts/pathSchema';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';

describe('TCK-059 Exponentiell backoff och slumpad jitter i BidiLiveAdapter', () => {
  it('skall ha korrekta standardvärden i BidiLiveAdapterConfigSchema', () => {
    const config = BidiLiveAdapterConfigSchema.parse({});
    expect(config.maxReconnectAttempts).toBe(5);
    expect(config.baseBackoffMs).toBe(1000);
    expect(config.maxJitterMs).toBe(1000);
  });

  it('skall återansluta vid transienta WS-fel och lyckas på tredje försöket', async () => {
    let attempts = 0;
    let closedSessions = 0;
    const emittedErrors: unknown[] = [];

    const eventBus = {
      emit: (event: string, err: unknown) => {
        if (event === 'error') {
          emittedErrors.push(err);
        }
      }
    };

    class MockSession {
      async sendClientContent(_opts: any) {
        attempts++;
      }
      async *receiveStream() {
        if (attempts < 3) {
          const err = new Error('Transient error');
          (err as any).code = 1011; 
          throw err;
        }
        yield { serverContent: { modelTurn: { parts: [{ text: 'lyckades' }] } } };
      }
      async close() {
        closedSessions++;
      }
    }

    class MockSdk {
      live = {
        connect: async (_opts: any) => {
          return new MockSession();
        }
      };
      constructor(_opts: any) {}
    }

    const adapter = skapaBidiLiveAdapter({
      apiKey: 'test-key',
      sdkConstructor: MockSdk,
      eventBus,
      baseBackoffMs: 5,
      maxJitterMs: 5,
    });

    const result = await adapter.skicka({ userPrompt: 'hej' });

    expect(result.svar).toBe('lyckades');
    expect(attempts).toBe(3);
    expect(closedSessions).toBe(3);
    expect(emittedErrors.length).toBe(0);
  });

  it('skall kasta fel och larma eventBus när maxReconnectAttempts överskrids', async () => {
    let attempts = 0;
    let closedSessions = 0;
    const emittedErrors: unknown[] = [];

    const eventBus = {
      emit: (event: string, err: unknown) => {
        if (event === 'error') {
          emittedErrors.push(err);
        }
      }
    };

    class MockSession {
      async sendClientContent(_opts: any) {
        attempts++;
      }
      async *receiveStream() {
        const err = new Error('Persistent transient error');
        (err as any).code = 1006; 
        throw err;
      }
      async close() {
        closedSessions++;
      }
    }

    class MockSdk {
      live = {
        connect: async (_opts: any) => {
          return new MockSession();
        }
      };
      constructor(_opts: any) {}
    }

    const adapter = skapaBidiLiveAdapter({
      apiKey: 'test-key',
      sdkConstructor: MockSdk,
      eventBus,
      baseBackoffMs: 2,
      maxJitterMs: 2,
      maxReconnectAttempts: 2
    });

    await expect(adapter.skicka({ userPrompt: 'hej' })).rejects.toThrow('Persistent transient error');

    // Initial attempt + 2 retries = 3 attempts total.
    expect(attempts).toBe(3);
    // Closed after each failed attempt + failed initial.
    expect(closedSessions).toBe(3);
    // Emitted error on each fail, or ultimately at exit. Contract says "annars anropa eventBus?.emit('error', err) och throw err"
    // Let's assert it emitted errors on failures.
    expect(emittedErrors.length).toBeGreaterThan(0);
  });
});