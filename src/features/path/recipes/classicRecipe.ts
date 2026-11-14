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
            { id: "step-1a", type: "STEP", name: "Avsikt - Steg 1a", kraft: "följa", execute: async (k) => exekverare("step-1a", k), run: async (k) => exekverare("step-1a", k) },
            { id: "step-0a", type: "STEP", name: "Omvändelse - Kontraktsaudit", kraft: "vända-om", execute: async (k) => exekverare("step-0a", k), run: async (k) => exekverare("step-0a", k) },
            { id: "step-0b", type: "STEP", name: "Förlikelse - Vägval & Godkännande", kraft: "förlikas", execute: async (k) => exekverare("step-0b", k), run: async (k) => exekverare("step-0b", k) },
            { id: "port-avsikt", type: "PORT", name: "Port - Avsikt", port: options.avsikt, run: options.avsikt },

            // Fas 1: Provning
            { id: "step-1b", type: "STEP", name: "Följa - Kartlägga Domän", kraft: "följa", execute: async (k) => exekverare("step-1b", k), run: async (k) => exekverare("step-1b", k) },
            { id: "step-2a", type: "STEP", name: "Följa - Avgränsa Tillstånd", kraft: "följa", execute: async (k) => exekverare("step-2a", k), run: async (k) => exekverare("step-2a", k) },
            { id: "step-2b", type: "STEP", name: "Följa - Modellera Kontrakt", kraft: "följa", execute: async (k) => exekverare("step-2b", k), run: async (k) => exekverare("step-2b", k) },
            { id: "step-2c", type: "STEP", name: "Vända-om - Utvärdera Resiliens", kraft: "vända-om", execute: async (k) => exekverare("step-2c", k), run: async (k) => exekverare("step-2c", k) },
            { id: "step-2d", type: "STEP", name: "Förlikas - Syntetisk Vägvägning", kraft: "förlikas", execute: async (k) => exekverare("step-2d", k), run: async (k) => exekverare("step-2d", k) },
            { id: "step-3a", type: "STEP", name: "Följa - Transient Testspec", kraft: "följa", execute: async (k) => exekverare("step-3a", k), run: async (k) => exekverare("step-3a", k) },
            { id: "step-3b", type: "STEP", name: "Följa - Källkodsspecifikation", kraft: "följa", execute: async (k) => exekverare("step-3b", k), run: async (k) => exekverare("step-3b", k) },
            { id: "step-2e", type: "STEP", name: "Vända-om - Operativt Delta", kraft: "vända-om", execute: async (k) => exekverare("step-2e", k), run: async (k) => exekverare("step-2e", k) },
            { id: "step-3d", type: "STEP", name: "Vända-om - Epistemisk Rannsakan", kraft: "vända-om", execute: async (k) => exekverare("step-3d", k), run: async (k) => exekverare("step-3d", k) },
            { id: "step-3e", type: "STEP", name: "Förlikas - Förlikning", kraft: "förlikas", execute: async (k) => exekverare("step-3e", k), run: async (k) => exekverare("step-3e", k) },
            { id: "step-3c", type: "STEP", name: "Förlikas - Byggkontrakt", kraft: "förlikas", execute: async (k) => exekverare("step-3c", k), run: async (k) => exekverare("step-3c", k) },
            { id: "port-provning", type: "PORT", name: "Port - Provning", port: options.provning, run: options.provning },

            // Fas 2: Konstruktion
            { id: "step-fas2", type: "STEP", name: "Konstruktion - Exekvering", kraft: "följa", execute: async (k) => exekverare("step-fas2", k), run: async (k) => exekverare("step-fas2", k) },
            { id: "port-konstruktion", type: "PORT", name: "Port - Konstruktion", port: options.konstruktion, run: options.konstruktion },

            // Fas 3: Besiktning
            { id: "port-besiktning", type: "PORT", name: "Port - Besiktning", port: options.besiktning, run: options.besiktning },
            { id: "step-fas3", type: "STEP", name: "Besiktning - Slutverifiering", kraft: "förlikas", execute: async (k) => exekverare("step-fas3", k), run: async (k) => exekverare("step-fas3", k) },
        ]
    };
}
