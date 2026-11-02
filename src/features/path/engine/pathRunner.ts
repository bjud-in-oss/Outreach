import { Port, PathContext } from '../model/types';

export class PortNekadError extends Error {
  constructor(public orsak?: string) {
    super(`Port nekad: ${orsak || 'Ingen orsak angavs'}`);
    this.name = 'PortNekadError';
  }
}

export async function knackaPaPorten(port: Port, kontext: PathContext): Promise<void> {
  const resultat = await port(kontext);
  if (!resultat.oppnad) {
    throw new PortNekadError(resultat.orsak);
  }
}
