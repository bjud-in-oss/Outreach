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

export interface TestKorselResultat {
  passerade: boolean;
  exitKod: number;
  felmeddelande?: string;
}

export type TestExekverare = (testFilVag: string) => Promise<TestKorselResultat>;

export interface ProvningsportOptions {
  testFilVag: string;
  forvantatFel: string;
  testExekverare: TestExekverare;
}

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
export interface BesiktningResultat {
  godkand: boolean;
  felmeddelande?: string;
}
export type BesiktningsInspekterare = (kontext: PathContext) => Promise<BesiktningResultat>;
export interface BesiktningsportOptions {
  inspekterare: BesiktningsInspekterare;
}

export type PathPhase = 'avsikt' | 'provning' | 'konstruktion' | 'besiktning';

export interface PromptCompileInput {
  fas: PathPhase;
  stegId: string;
  ticketId: string;
  malDoman: string;
  uppdrag: string;
  biljettText?: string;
  kontextMinne?: Record<string, unknown>;
}

export interface CompiledPrompt {
  systemInstruction: string;
  userPrompt: string;
  beraknadeTokensUngefar: number;
}

export interface SessionAdapter {
  skicka: (prompt: CompiledPrompt) => Promise<{ svar: string; tokensAnvanda?: number }>;
}
