import { OrchestratorConfig } from '../contracts/pathSchema';
import { SessionAdapter, Port, PathRecipe } from '../model/types';
import { exekveraRecept } from './pathRunner';
import { skapaClassicRecept } from '../recipes/classicRecipe';
import { skapaLeanRecept } from '../recipes/leanRecipe';
import { skapaStegExekverare } from './runtimeAdapter';

export function skapaPathOrkestrerare(options: { 
  adapter: SessionAdapter; 
  portar: { avsikt: Port; provning: Port; konstruktion: Port; besiktning: Port }; 
  config: OrchestratorConfig 
}) {
  const stegExekverare = skapaStegExekverare(options.adapter, {
    ticketId: options.config.ticketId,
    malDoman: options.config.malDoman,
    basUppdrag: options.config.uppdrag
  });

  const receptOptions = {
    avsikt: options.portar.avsikt,
    provning: options.portar.provning,
    konstruktion: options.portar.konstruktion,
    besiktning: options.portar.besiktning,
    stegExekverare
  };

  const recipe: PathRecipe = options.config.receptTyp === 'classic' 
    ? skapaClassicRecept(receptOptions)
    : skapaLeanRecept(receptOptions);

  return {
    recept: recipe,
    kor: async () => korPathCykel(recipe, options.config.kontextMinne || {})
  };
}

export async function korPathCykel(recipe: PathRecipe, kontextMinne: Record<string, unknown>) {
  const result = await exekveraRecept(recipe, { minne: kontextMinne });
  return {
    success: result.success,
    slutfold: result.slutfold || false,
    logg: result.logg || []
  };
}
