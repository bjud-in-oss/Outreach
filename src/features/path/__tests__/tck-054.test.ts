import { describe, it, expect } from 'vitest';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';

describe('transient TCK-054 - BidiLiveAdapter SDK Fabric', () => {
  it('skall kasta fel nar API-nyckel saknas och clientFactory ej finns', async () => {
    const adapter = skapaBidiLiveAdapter({});

    await expect(adapter.skicka({ userPrompt: 'hej' })).rejects.toThrow(
      'API-nyckel saknas för Gemini Live SDK'
    );
  });
});
