import { describe, it, expect } from 'vitest';
import { skapaClassicRecept } from '../recipes/classicRecipe';
import { PathContext } from '../model/types';

describe('TCK-065: classicRecipe kontraktstest', () => {
    it('ska skapa ett recept där alla noder uppfyller BaseNode-kontraktet (id och name)', async () => {
        const recept = skapaClassicRecept({
            avsikt: async () => ({ oppnad: true }),
            provning: async () => ({ oppnad: true }),
            konstruktion: async () => ({ oppnad: true }),
            besiktning: async () => ({ oppnad: true }),
        });

        expect(recept.id).toBe('path-classic');
        expect(recept.nodes.length).toBeGreaterThan(0);

        // Kontrollera att varje nod har id och name
        recept.nodes.forEach(node => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('name'); // Detta kommer troligen fallera innan fix
            expect(typeof node.id).toBe('string');
            expect(typeof node.name).toBe('string');
        });
    });

    it('ska kunna exekvera en nod utan fel', async () => {
        const stegExekverare = async (stegId: string) => {
            if (stegId === 'step-1a') return { success: true };
            return { success: false };
        };

        const recept = skapaClassicRecept({
            avsikt: async () => ({ oppnad: true }),
            provning: async () => ({ oppnad: true }),
            konstruktion: async () => ({ oppnad: true }),
            besiktning: async () => ({ oppnad: true }),
            stegExekverare
        });

        const step1a = recept.nodes.find(n => n.id === 'step-1a');
        expect(step1a).toBeDefined();

        if (step1a && step1a.type === 'STEP') {
            const resultat = await step1a.execute({} as PathContext);
            expect(resultat.success).toBe(true);
        }
    });
});
