import { 
  skapaPathOrkestrerare, 
  skapaMockSessionAdapter 
} from '../src/features/path';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const ticketId = process.argv[2] || 'PROMPT';
  console.log(`🚀 Kör Vägmotorn för biljett: ${ticketId}`);

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
      console.warn(`⚠️ Biljettfil ej hittad: ${ticketPath}`);
    }
  }

  // Dummy-portar som uppfyller kontrakten för orkestreraren
  const dummyPortar = {
    avsiktsport: async () => ({ godkand: true, data: {} }),
    konstruktionsport: async () => ({ godkand: true, data: {} }),
    besiktningsport: async () => ({ godkand: true, data: {} }),
    provningsport: async () => ({ godkadot: true, data: {} }),
  };

  const adapter = skapaMockSessionAdapter();
  const orkestrerare = skapaPathOrkestrerare({
    adapter,
    portar: dummyPortar as any
  });

  try {
    console.log('📦 Initierar orkestrering...');
    // Kör orkestreraren (anpassad efter faktiskt kontrakt i nästa steg om det behövs)
    // Eftersom vi inte har den exakta signaturen för körning exponerad i detalj här, 
    // anropar vi en standardkörningsmetod för receptet.
    const resultat = await orkestrerare.kor({
      doman: 'path',
      kontext: { biljettId, ticketContent }
    });

    console.log('🏁 Orkestrering slutförd.');
    console.log('📝 Slutrapport:', JSON.stringify(resultat, null, 2));
  } catch (error) {
    console.error('❌ Fel under exekvering av Vägmotorn:', error);
    process.exit(1);
  }
}

main();
