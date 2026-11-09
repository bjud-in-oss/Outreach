import { describe, it, expect } from 'vitest';
import { exekveraRecept } from '../engine/pathRunner';
import { PathRecipe, PathContext } from '../model/types';
import { PathPhase } from '../contracts/pathSchema';

describe('TCK-044: PathContext Phase Enrichment', () => {
    it('should enrich PathContext with aktuellFas during execution', async () => {
        let capturedPhase: PathPhase | undefined;

        const mockRecipe: PathRecipe = {
            id: 'test-recipe',
            name: 'Test Recept',
            description: 'Test för fasberikning',
            nodes: [
                {
                    id: 'port-avsikt/p1',
                    execute: async (context: PathContext) => {
                        capturedPhase = context.aktuellFas;
                        return { status: 'success' };
                    }
                }
            ]
        };

        const mockContext: PathContext = {
            campaignId: 'test-campaign',
            userId: 'test-user',
            sessionAdapter: {} as any,
            eventBus: {} as any,
            logger: {} as any
        };

        await exekveraRecept(mockRecipe, mockContext);

        expect(capturedPhase).toBe('avsikt');
    });
});
