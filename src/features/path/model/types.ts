export interface PathContext {
  biljettDatum?: string;
  aktuellFas?: string;
  minne?: Record<string, unknown>;
}

export interface PortResult {
  oppnad: boolean;
  orsak?: string;
  omvandelseKrav?: string;
}

export type Port = (kontext: PathContext) => Promise<PortResult>;

export interface BaseNode {
  id: string;
  name: string;
  kraft?: 'följa' | 'vända-om' | 'förlikas';
  maxTokens?: number;
}

export interface StepResult {
  success: boolean;
  data?: unknown;
  tokensUsed?: number;
}

export interface StepNode extends BaseNode {
  type: 'STEP';
  execute: (kontext: PathContext) => Promise<StepResult>;
}

export interface PortNode extends BaseNode {
  type: 'PORT';
  port: Port;
}

export type PathNode = StepNode | PortNode;

export interface PathRecipe {
  id: string;
  name: string;
  description: string;
  nodes: PathNode[];
}

export type Prompter = (fraga: string) => Promise<string>;

export interface AvsiktsportOptions {
  prompter: Prompter;
  beskrivning: string;
  exempel?: string;
}
