import { 
  skapaPathOrkestrerare, 
  skapaMockSessionAdapter,
  OrchestratorConfig
} from '../src/features/path';
import { skapaNodePathPortar } from './lib/pathNodePorts.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

export async function exekveraRunPath(options: { 
  ticketId?: string; 
  argv?: string[]; 
  io?: any; 
  adapter?: any;
  clientFactory?: any;
} = {}) {
  const io = options.io || {
    log: console.log,
    error: console.error,
    warn: console.warn
  };
  
  const argv = options.argv || process.argv.slice(2);
  const ticketId = options.ticketId || argv[0] || 'PROMPT';
  io.log(`🚀 Kör Vägmotorn för biljett: ${ticketId}`);

  let ticketContent = '';
  if (ticketId === 'PROMPT') {
    const promptPath = path.join(process.cwd(), 'PROMPT.md');
    if (fs.existsSync(promptPath)) {
      ticketContent = fs.readFileSync(promptPath, 'utf-8');
    }
  } else {
    const ticketPath = path.join(process.cwd(), 'doc', '.TICKETS', `${ticketId}.md`);
    if (fs.existsSync(ticketPath)) {
      ticketContent = fs.readFileSync(ticketPath, 'utf-8');
    } else {
      io.warn(`⚠️ Biljettfil ej hittad: ${ticketPath}`);
    }
  }

  const isClassic = argv.includes('--classic');
  const isLive = argv.includes('--live');
  const isDryRun = argv.includes('--dry-run');
  const receptTyp = isClassic ? 'classic' : 'lean';

  if (isDryRun) {
    io.log(`   🛡️ [DRY-RUN]: Skarpt läge utan diskmodifiering aktivt.`);
  }
  
  const config: OrchestratorConfig = {
    ticketId,
    malDoman: 'path',
    receptTyp,
    uppdrag: ticketContent
  };

  const portar = skapaNodePathPortar({ ticketId, io, dryRun: isDryRun || !isLive });

  let adapter = options.adapter;

  if (!adapter) {
    if (isLive) {
      io.log(`🌐 Aktiverar skarp BidiLive-koppling mot Gemini...`);
      adapter = skapaBidiLiveAdapter({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.LIVE_MODEL || 'gemini-3.8-live',
        modality: (process.env.BIDI_MODALITY as any) || 'AUDIO'
      }, options.clientFactory);
    } else {
      adapter = {
        skicka: async (prompt: any) => {
          const stegMatch = prompt.userPrompt.match(/StegId: ([^\n]+)/);
          const stegId = stegMatch ? stegMatch[1].trim() : 'okänt-steg';
          io.log(`   ⚡ [STEG: ${stegId}] Prompt kompilerad (${prompt.beraknadeTokensUngefar || 50} tokens) -> Exekverar.`);
          return { svar: `Syntetiskt källkodssvar för ${stegId}`, tokensAnvanda: 50 };
        }
      };
    }
  }

  const orkestrerare = skapaPathOrkestrerare({
    adapter,
    portar,
    config
  });

  try {
    io.log(`📦 Initierar orkestrering med recept: ${receptTyp}...`);
    const resultat = await orkestrerare.kor();

    io.log('🏁 Orkestrering slutförd.');
    io.log('📝 Slutrapport:', JSON.stringify(resultat, null, 2));
    
    return resultat;
  } catch (error) {
    io.error('❌ Fel under exekvering av Vägmotorn:', error);
    throw error;
  }
}

const isDirectCli = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('run-path.ts') ||
  process.argv[1].endsWith('run-path.js')
);

if (isDirectCli) {
  exekveraRunPath().catch(() => process.exit(1));
}
