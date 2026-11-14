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
    await new Promise((r) => setTimeout(r, 750));
    return response;
  } catch (err: any) {
    runner.close();
    await new Promise((r) => setTimeout(r, 750));
    throw err;
  }
}

export async function diagnostiseraRotOrsak(
  ai: any,
  modelName: string,
  contextTitle: string,
  errorLog: string,
  sourceContext: string,
  si: string
): Promise<string> {
  const prompt1 = `Zoom ut och analysera arkitektonisk integritet och modulär expansion. Spåra de inledande mekaniska faktafrågorna (Varför 1-3). Öppna 3 ortogonala felhypoteser utan rangordning. Ställ den Epistemiska Falsifieringsfrågan och ange återstående frågedjup (minst 2, dvs Varför 4-5+), strippad från slutsatser.
KÄLLKOD OCH KONTEXT:
${sourceContext}

FELLOGG:
${errorLog}`;

  const resp1 = await runMicroChannel(ai, modelName, 'Att vända om', prompt1, contextTitle, si, [], undefined, { maxTurns: 1 });

  const prompt2 = `Väg hypoteserna från föregående diagnos mot fellogg och källkod. Välj fritt egna prövningsfrågor för att testa anpassning av befintliga repoidéer. Slutför Varför 4-5+, logga domen i CYCLE_LOG.md och lås EGENTLIGT_FEL.

DIAGNOS 1:
${resp1}`;

  const resp2 = await runMicroChannel(ai, modelName, 'Att förlikas', prompt2, contextTitle, si, [], undefined, { maxTurns: 1 });
  
  const logHeader = `ROTORSAKSDIAGNOS: ${contextTitle}`;
  appendCycleLog(logHeader, resp2);
  
  return resp2;
}

export async function sparaMetaOmvandelse(
  ai: any,
  modelName: string,
  ticketId: string,
  errLog: string,
  si: string
): Promise<string> {
  return await diagnostiseraRotOrsak(ai, modelName, `Meta-Omvandelse: ${ticketId}`, errLog, 'Internt tillstånd vid haveri', si);
}

export { hanteraKonstruktivKritik } from './critiqueTriage.js';
