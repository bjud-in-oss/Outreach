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
