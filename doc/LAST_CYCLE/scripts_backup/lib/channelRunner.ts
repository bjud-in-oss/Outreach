import * as fs from 'fs';
import * as path from 'path';
import { BidiLiveSession } from '../bidiLiveRunner.js';

const ROOT_DIR = process.cwd();
const CYCLE_LOG_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(CYCLE_LOG_DIR, 'CYCLE_LOG.md');
const SI_PATH = path.join(ROOT_DIR, 'doc', 'SI_v10.5.md');
const FEATURE_INDEX_PATH = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

export function getFeatureIndexText(): string {
  if (fs.existsSync(FEATURE_INDEX_PATH)) return fs.readFileSync(FEATURE_INDEX_PATH, 'utf-8');
  return '';
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
    systemInstruction: `${si}\n\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\n\n${getInstalledDependencies()}\n\nDu agerar som kraften: ${kraft}.\nUppgift: ${stepInstruction}`,
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
    await new Promise((r) => setTimeout(r, 400));
    return response;
  } catch (err: any) {
    runner.close();
    await new Promise((r) => setTimeout(r, 400));
    throw err;
  }
}

export const inspectionTools = [
  {
    name: 'read_file',
    behavior: 'NON_BLOCKING',
    description: 'Läser fil i repot (stora filer trunkeras).',
    parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' } }, required: ['file_path'] },
  },
  {
    name: 'list_files',
    behavior: 'NON_BLOCKING',
    description: 'Listar innehållet i en katalog.',
    parameters: { type: 'OBJECT', properties: { directory_path: { type: 'STRING' } }, required: ['directory_path'] },
  }
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
    return entries.map(e => `${e.isDirectory() ? '[DIR]' : '[FIL]'} ${e.name}`).join('\n');
  }
  return 'Okänt verktyg';
}
