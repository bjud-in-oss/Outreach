import { PathContext, Port, PortResult } from '../model/types';

export interface BesiktningsportOptions {
  inspekterare: (kontext: PathContext) => Promise<{ godkand: boolean; felmeddelande?: string }>;
}

export function skapaBesiktningsport(options: BesiktningsportOptions): Port {
  return async (kontext: PathContext): Promise<PortResult> => {
    const resultat = await options.inspekterare(kontext);
    
    if (resultat.godkand) {
      return { oppnad: true };
    }
    
    return { 
      oppnad: false, 
      orsak: "Besiktning underkänd: " + (resultat.felmeddelande || "Okänt fel"), 
      omvandelseKrav: "ÅTGÄRDA_BESIKTNING" 
    };
  };
}
