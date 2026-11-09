import { 
  skapaPathOrkestrerare, 
  skapaMockSessionAdapter,
  OrchestratorConfig
} from '../src/features/path';
import * as fs from 'fs';
import * as path from 'path';

export async function exekveraRunPath(options: { 
  ticketId?: string; 
  argv?: string[]; 
  io?: any; 
  adapter?: any 
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
  const receptTyp = isClassic ? 'classic' : 'lean';
  
  const config: OrchestratorConfig = {
    ticketId,
    malDoman: 'path', // Standard domän för dessa underhållsuppgifter
    receptTyp,
    uppdrag: ticketContent
  };

  // Dummy-portar som loggar till io.log och uppfyller kontrakten
  const dummyPortar = {
    avsikt: async (ctx: any) => {
      io.log(` port:avsikt körs, fas: ${ctx.aktuellFas}`);
      return { oppnad: true };
    },
    konstruktion: async () => {
      io.log(` port:konstruktion körs`);
      return { oppnad: true };
    },
    besiktning: async () => {
      io.log(` port:besiktning körs`);
      return { oppnad: true, godkand: true };
    },
    provning: async () => {
      io.log(` port:provning körs`);
      return { oppnad: true };
    },
  };

  const adapter = options.adapter || skapaMockSessionAdapter();
  const orkestrerare = skapaPathOrkestrerare({
    adapter,
    portar: dummyPortar as any,
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

if (require.main === module) {
  exekveraRunPath().catch(() => process.exit(1));
}
