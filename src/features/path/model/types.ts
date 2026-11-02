export interface PathContext {
  biljettDatum: string;
  aktuellFas: string;
  minne: Record<string, unknown>;
}

export interface PortResult {
  oppnad: boolean;
  orsak?: string;
  omvandelseKrav?: string;
}

export type Port = (kontext: PathContext) => Promise<PortResult>;
