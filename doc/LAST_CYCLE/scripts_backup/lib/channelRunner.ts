import * as fs from 'fs';
import * as path from 'path';
import { BidiLiveSession } from '../bidiLiveRunner.js';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.5.md');
const FEATURE_INDEX_PATH = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

export function getFeatureIndexText(activeDomain?: string): string {
  if (!fs.existsSync(FEATURE_INDEX_PATH)) return '';
  try {
    const data = JSON.parse(fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8'));
    const compact: Record<string, any> = {};
    for (const [dom, info] of Object.entries<any>(data.features || {})) {
      compact[dom] = (!activeDomain || dom === activeDomain || dom === 'shared')
        ? info
        : { filesCount: (info.files || []).length };
    }
    return JSON.stringify(compact);
  } catch {
    return fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8').slice(0, 4000);
  }
}

export function getInstalledDependencies(): string {
  if (!fs.existsSync(PKG_PATH)) return '';
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    return `TILLGÄNGLIGA PAKET I PROJEKTET:\n${[...deps, ...devDeps].join(', ')}`;
  } catch {
    return '';
  }
}

export function appendCycleLog(header: string, content: string) {
  if (!fs.existsSync(CYCLE_LOG_DIR)) fs.mkdirSync(CYCLE_LOG_DIR, { recursive: true });
  fs.appendFileSync(CYCLE_LOG_PATH, `\n\n#### ${header}\n${content.trim()}\n`, 'utf-8');
}

export const inspectionTools = [
  {
    name: 'read_file',
    behavior: 'NON_BLOCKING',
    description: 'Läser en fil i repot.',
    parameters: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Relativ sökväg till filen' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'list_files',
    behavior: 'NON_BLOCKING',
    description: 'Listar filer i en katalog.',
    parameters: {
      type: 'object',
      properties: {
        directory_path: { type: 'string', description: 'Relativ sökväg till katalogen' },
      },
      required: ['directory_path'],
    },
  },
];

export function executeInspection(name: string, args: any): string {
  if (name === 'read_file') {
    const full = path.resolve(ROOT_DIR, args.file_path);
    if (!fs.existsSync(full)) return `Filen ${args.file_path} finns inte.`;
    return fs.readFileSync(full, 'utf-8');
  }
  if (name === 'list_files') {
    const rel = args.directory_path || '.';
    const full = path.resolve(ROOT_DIR, rel);
    if (!fs.existsSync(full)) return `Katalogen ${rel} finns inte.`;
    const entries = fs.readdirSync(full, { withFileTypes: true });
    return entries.map((e) => `${e.isDirectory() ? '[DIR]' : '[FIL]'} ${e.name}`).join('\n');
  }
  return 'Okänt verktyg';
}

export async function diagnostiseraRotOrsak(
  ai: any,
  modelName: string,
  contextTitle: string,
  errorLog: string,
  sourceContext: string,
  si: string
): Promise<string> {
  console.log(`[Diagnostics] Startar 2-sessioners djupanalys för: ${contextTitle}`);
  const decisionsPath = path.join(ROOT_DIR, 'doc', 'DECISIONS.md');
  let adrHeaders = '';
  try {
    if (fs.existsSync(decisionsPath)) {
      const decisions = fs.readFileSync(decisionsPath, 'utf-8');
      const adrMatches = decisions.match(/^## ADR-.*$/gm);
      if (adrMatches) {
        adrHeaders = `Relevanta ADR-rubriker:\n${adrMatches.join('\n')}`;
      }
    }
  } catch (fsError) {
    console.warn(`[Diagnostics] Kunde inte läsa doc/DECISIONS.md`);
  }

  const instruction1 = `Analysera felloggen och sök efter grundorsaken.\n1. Identifiera 3 ortogonala hypotetiska orsaker till problemet.\n2. Formulera en epistemisk falsifieringsfråga för att pröva hypoteserna.\nFokusera på Varför 1-3.`;
  const startAnchor1 = `FELLOGG:\n${errorLog}\n\nKÄLLKONTEXT:\n${sourceContext}\n\n${adrHeaders}`;
  
  console.log(`\n🔍 [DIAGNOSTICS] Kanal 1: Att vända om (Hypoteser & Falsifiering)`);
  const analysis1 = await runMicroChannel(
    ai,
    modelName,
    'Att vända om',
    instruction1,
    startAnchor1,
    si,
    inspectionTools,
    executeInspection
  );

  appendCycleLog(`Diagnostics - Vända om (Session 1) - ${contextTitle}`, analysis1);

  const instruction2 = `Syntetisera analysen från session 1 och formulera slutsatserna.\n1. Presentera de 3 hypoteserna och falsifieringsresultatet.\n2. Fördjupa analysen med 'Varför 4-5+' för att förstå systemiska brister.\n3. Skapa en sammanfattning som kan föras in i CYCLE_LOG.`;
  const startAnchor2 = `FELLOGG:\n${errorLog}\n\nANALYS FRÅN SESSION 1:\n${analysis1}\n\n${adrHeaders}`;
  
  console.log(`\n🤝 [DIAGNOSTICS] Kanal 2: Att förlikas (Syntes & Systemisk Slutsats)`);
  const analysis2 = await runMicroChannel(
    ai,
    modelName,
    'Att förlikas',
    instruction2,
    startAnchor2,
    si,
    inspectionTools,
    executeInspection
  );

  appendCycleLog(`Diagnostics - Förlikas (Session 2) - ${contextTitle}`, analysis2);

  return analysis2;
}

interface ChannelOptions {
  requireMutation?: boolean;
  maxTurns?: number;
  onMutationCheck?: () => boolean;
  getFollowupPrompt?: () => string;
}

export async function runMicroChannel(
  ai: any,
  modelName: string,
  kraft: 'Att följa' | 'Att vända om' | 'Att förlikas',
  stepInstruction: string,
  startAnchor: string,
  si: string,
  tools: any[] = [],
  executeTool?: (name: string, args: any) => string,
  options: ChannelOptions = {}
): Promise<string> {
  const runner = new BidiLiveSession({
    ai,
    model: modelName,
    systemInstruction: `${si}\n\nREPOTOPOGRAFI:\n${getFeatureIndexText(startAnchor.match(/DOMÄN:\s*([a-zA-Z0-9_-]+)/)?.[1])}\n\n${getInstalledDependencies()}\n\nDu agerar som kraften: ${kraft}.\nUppgift: ${stepInstruction}`,
    tools,
    executeTool,
  });

  try {
    let response = await runner.send(`STARTANKARE:\n${startAnchor}\n\nUPPDRAG:\n${stepInstruction}`);
    
    const maxTurns = options.maxTurns || 3;
    let turn = 1;

    while (options.requireMutation && options.onMutationCheck && !options.onMutationCheck() && turn < maxTurns) {
      turn++;
      const followUp = options.getFollowupPrompt ? options.getFollowupPrompt() : `Du har genomfört inspektion. Slutför nu uppdraget omedelbart!`;
      console.log(`\n   🔁 [ACTION LOOP]: Krav ej uppfyllt ännu. Fortsätter mikrokanalen (vända ${turn}/${maxTurns})...`);
      response = await runner.send(followUp);
    }

    runner.close();
    await new Promise((r) => setTimeout(r, 1500));
    return response;
  } catch (err: any) {
    runner.close();
    await new Promise((r) => setTimeout(r, 1500));
    throw err;
  }
}
