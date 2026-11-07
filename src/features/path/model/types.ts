export interface FilKrav {
  filVag: string;
  maxRader?: number;
  kravsExport?: boolean;
}

export interface FilInspektion {
  existerar: boolean;
  antalRader: number;
  exporteradIIndex?: boolean;
}

export type FilInspekterare = (krav: FilKrav, barrelVag?: string) => Promise<FilInspektion>;

export interface KonstruktionsportOptions {
  matris: FilKrav[];
  inspekterare: FilInspekterare;
  barrelVag?: string;
}

export interface PathContext {
  [key: string]: any;
}

export interface PortResult {
  oppnad: boolean;
  orsak?: string;
  omvandelseKrav?: string;
}

export type Port = (kontext: PathContext) => Promise<PortResult>;

export class PortNekadError extends Error {
  constructor(public orsak: string, public omvandelseKrav?: string) {
    super(orsak);
    this.name = 'PortNekadError';
  }
}
