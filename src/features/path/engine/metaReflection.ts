import { z } from 'zod';
import { SessionAdapter } from '../model/types';
import { MetaKritikResultatSchema, MetaKritikResultat } from '../contracts/pathSchema';

export async function genereraKonstruktivKritik(
    adapter: SessionAdapter, 
    kontextMinne: Record<string, any>
): Promise<MetaKritikResultat> {
    const prompt = {
        systemInstruction: "Du är en expert på metareflektion och kvalitetsgranskning.",
        userPrompt: `Granska utfallet och ge konstruktiv kritik. Kontextminne: ${JSON.stringify(kontextMinne)}`
    };
    
    const res = await adapter.skicka(prompt);
    let parsed;
    try {
        parsed = typeof res.svar === 'string' ? JSON.parse(res.svar) : res.svar;
    } catch (e) {
        throw new Error('Kunde inte tolka svar som JSON från metareflektion');
    }
    
    return MetaKritikResultatSchema.parse(parsed);
}

export function rensaGenomfordaBatchPoster(batchKoper: any[], ids: string[]): any[] {
    return batchKoper.filter(p => !ids.includes(p.id));
}

export function omprioriteraBatchQueue(
    queue: any[], 
    papperskorg: any[], 
    inaktuellaIds: string[] = []
): { aktiva: any[], papperskorg: any[] } {
    // Töm papperskorg (vi returnerar en ny tom lista för papperskorgen som ska användas)
    let nyPapperskorg = [...papperskorg];
    
    // Flytta inaktuella poster till papperskorgen
    const inaktuella = queue.filter(p => inaktuellaIds.includes(p.id));
    nyPapperskorg.push(...inaktuella);
    
    // Behåll endast aktiva poster
    const aktivaPoster = queue.filter(p => !inaktuellaIds.includes(p.id));
    
    // Sortera aktiva poster: HOG > MEDEL > LAG
    const prioritetVarde = { HOG: 3, MEDEL: 2, LAG: 1 };
    aktivaPoster.sort((a, b) => {
        const prioA = prioritetVarde[a.prioritet as keyof typeof prioritetVarde] || 0;
        const prioB = prioritetVarde[b.prioritet as keyof typeof prioritetVarde] || 0;
        return prioB - prioA;
    });
    
    return {
        aktiva: aktivaPoster,
        papperskorg: nyPapperskorg
    };
}
