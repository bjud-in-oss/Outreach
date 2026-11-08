import { Port, PathContext, PathRecipe, PortResult } from '../model/types';

export class PortNekadError extends Error {
  constructor(public orsak?: string, public omvandelseKrav?: string) {
    super(`Port nekad: ${orsak || 'Ingen orsak angavs'}`);
    this.name = 'PortNekadError';
  }
}

export async function knackaPaPorten(port: Port, kontext: PathContext): Promise<PortResult> {
  const resultat = await port(kontext);
  if (!resultat.oppnad) {
    throw new PortNekadError(resultat.orsak, resultat.omvandelseKrav);
  }
  return resultat;
}

export async function exekveraRecept(recipe: PathRecipe, kontext: PathContext): Promise<{ sucess: boolean }> {
  for (const node of recipe.nodes) {
    if (node.type === 'STEP') {
      const result = await node.execute(kontext);
      if (!result.success) {
        throw new Error(`Steg misslyckades: ${node.name}`);
      }
    } else if (node.type === 'PORT') {
      await knackaPaPorten(node.port, kontext);
    }
  }
  return { sucess: true };
}
