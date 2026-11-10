import { describe, it, expect, beforeEach } from 'vitest';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';
import { getGlobalSwarmEventBus } from '../../gemini_live_swarm/bus/swarmEventBus';
import type { CompiledPrompt } from '../contracts/pathSchema';

describe('BidiLiveAdapter Resilient Streaming (TCK-047)', () => {
    beforeEach(() => {
        const eventBus = getGlobalSwarmEventBus();
        eventBus.clear();
    });

    it('ska ackumulera strömmen i minnet och anropa close', async () => {
        const eventBus = getGlobalSwarmEventBus();
        let closeCalled = false;

        const mockClientFactory = async () => {
            return {
                sendPrompt: async () => {},
                receiveStream: async function* () {
                    yield { text: 'Hej ' };
                    yield { text: 'världen!' };
                },
                close: async () => {
                    closeCalled = true;
                }
            };
        };

        const adapter = skapaBidiLiveAdapter({ 
            clientFactory: mockClientFactory as any, 
            eventBus 
        });

        const prompt: CompiledPrompt = { 
            model: 'gemini-2.5-flash',
            systemPrompt: 'Du är en hjälpsam assistent.',
            userPrompt: 'Hälsa' 
        };

        const resultat = await adapter.skicka(prompt);

        expect(resultat.svar).toBe('Hej världen!');
        expect(closeCalled).toBe(true);
    });

    it('ska fånga upp nätverksfel, larma via eventBus och kasta om', async () => {
        const eventBus = getGlobalSwarmEventBus();
        let closeCalled = false;
        let emittatFel: unknown = null;

        eventBus.subscribe('error', (err) => {
            emittatFel = err;
        });

        const networkError = new Error('Nätverkskrasch');

        const mockClientFactory = async () => {
            return {
                sendPrompt: async () => {},
                receiveStream: async function* () {
                    throw networkError;
                },
                close: async () => {
                    closeCalled = true;
                }
            };
        };

        const adapter = skapaBidiLiveAdapter({ 
            clientFactory: mockClientFactory as any, 
            eventBus 
        });

        const prompt: CompiledPrompt = { 
            model: 'gemini-2.5-flash',
            systemPrompt: '',
            userPrompt: '' 
        };

        await expect(adapter.skicka(prompt)).rejects.toThrow('Nätverkskrasch');
        expect(emittatFel).toBe(networkError);
        expect(closeCalled).toBe(true);
    });
});