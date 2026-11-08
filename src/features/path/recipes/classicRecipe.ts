import { PathRecipe, Port } from '../model/types';

export type ClassicReceptOptions = {
    avsikt: Port;
    provning: Port;
    konstruktion: Port;
    besiktning: Port;
    stegExekverare?: (stegId: string, kontext: any) => Promise<{ success: boolean }>;
};

export function skapaClassicRecept(options: ClassicReceptOptions): PathRecipe {
    const exekverare = options.stegExekverare || (async () => ({ success: true }));

    return {
        id: "path-classic",
        name: "Vägen Classic 12-Steg",
        description: "Deklarativ referensmodell baserad på SI v10.5",
        nodes: [
            // Fas 0: Avsikt
            { id: "step-1a", type: "STEP", execute: async (k) => exekverare("step-1a", k), run: async (k) => exekverare("step-1a", k) },
            { id: "step-0a", type: "STEP", execute: async (k) => exekverare("step-0a", k), run: async (k) => exekverare("step-0a", k) },
            { id: "step-0b", type: "STEP", execute: async (k) => exekverare("step-0b", k), run: async (k) => exekverare("step-0b", k) },
            { id: "port-avsikt", type: "PORT", port: options.avsikt, run: options.avsikt },

            // Fas 1: Provning
            { id: "step-1b", type: "STEP", execute: async (k) => exekverare("step-1b", k), run: async (k) => exekverare("step-1b", k) },
            { id: "step-2a", type: "STEP", execute: async (k) => exekverare("step-2a", k), run: async (k) => exekverare("step-2a", k) },
            { id: "step-2b", type: "STEP", execute: async (k) => exekverare("step-2b", k), run: async (k) => exekverare("step-2b", k) },
            { id: "step-2c", type: "STEP", execute: async (k) => exekverare("step-2c", k), run: async (k) => exekverare("step-2c", k) },
            { id: "step-2d", type: "STEP", execute: async (k) => exekverare("step-2d", k), run: async (k) => exekverare("step-2d", k) },
            { id: "step-3a", type: "STEP", execute: async (k) => exekverare("step-3a", k), run: async (k) => exekverare("step-3a", k) },
            { id: "step-3b", type: "STEP", execute: async (k) => exekverare("step-3b", k), run: async (k) => exekverare("step-3b", k) },
            { id: "step-2e", type: "STEP", execute: async (k) => exekverare("step-2e", k), run: async (k) => exekverare("step-2e", k) },
            { id: "step-3d", type: "STEP", execute: async (k) => exekverare("step-3d", k), run: async (k) => exekverare("step-3d", k) },
            { id: "step-3e", type: "STEP", execute: async (k) => exekverare("step-3e", k), run: async (k) => exekverare("step-3e", k) },
            { id: "step-3c", type: "STEP", execute: async (k) => exekverare("step-3c", k), run: async (k) => exekverare("step-3c", k) },
            { id: "port-provning", type: "PORT", port: options.provning, run: options.provning },

            // Fas 2: Konstruktion
            { id: "step-fas2", type: "STEP", execute: async (k) => exekverare("step-fas2", k), run: async (k) => exekverare("step-fas2", k) },
            { id: "port-konstruktion", type: "PORT", port: options.konstruktion, run: options.konstruktion },

            // Fas 3: Besiktning
            { id: "port-besiktning", type: "PORT", port: options.besiktning, run: options.besiktning },
            { id: "step-fas3", type: "STEP", execute: async (k) => exekverare("step-fas3", k), run: async (k) => exekverare("step-fas3", k) },
        ]
    };
}
