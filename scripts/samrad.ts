/**
 * scripts/samrad.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Självgående, arkitekturmedvetet samråd för icke-programmerande domänexperter.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import { BidiLiveSession } from './bidiLiveRunner.ts';

const ROOT_DIR = process.cwd();
const MODEL_NAME = process.env.LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-live';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ KRITISKT FEL: GEMINI_API_KEY saknas.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });

function executeSamradTool(name: string, args: Record<string, any>): string {
  try {
    if (name === 'read_file') {
      const relPath = args.file_path || args.path;
      const targetPath = path.resolve(ROOT_DIR, relPath);
      if (!fs.existsSync(targetPath)) return `FEL: Filen ${relPath} finns inte.`;
      const data = fs.readFileSync(targetPath, 'utf-8');
      console.log(`\n   📖 [LÄSTE FIL]: ${relPath} (${data.length} tecken)`);
      return data;
    }

    if (name === 'save_file') {
      const relPath = args.file_path || args.path;
      const content = args.content || args.code;

      if (!relPath || typeof content !== 'string') {
        return 'FEL: file_path och content krävs.';
      }

      // Normalisera sökvägen (ta bort inledande ./ och harmonisera snedstreck)
      const normalizedRel = relPath.replace(/^\.\//, '').replace(/\\/g, '/');

      // 🛑 MEKANISK SPÄRR 1: Mötesbryggan får ALDRIG ändra produktionskod under src/
      if (!normalizedRel.startsWith('doc/')) {
        console.warn(`\n   ⛔ [SAMRÅD AVVISAT]: Försök att skriva källkod utanför doc/ stoppat: ${normalizedRel}`);
        return "AVVISAD AV WAYFINDER: I mötesbryggan får du ALDRIG skriva eller ändra källkod under 'src/'. Ditt uppdrag här är ENBART att formulera Gherkin-scenarier under 'doc/features/' och byggbiljetter under 'doc/.TICKETS/'. All källkod måste byggas autonomt via byggmotorn (pnpm bygg). Rätta ditt anrop till en fil under doc/.TICKETS/ eller doc/features/!";
      }

      // 🛑 MEKANISK SPÄRR 2: Förhindra att befintliga biljetter skrivs över
      const targetFullPath = path.resolve(ROOT_DIR, normalizedRel);
      if (normalizedRel.startsWith('doc/.TICKETS/') && fs.existsSync(targetFullPath)) {
        console.warn(`\n   ⛔ [BILJETT-KOLLISION]: Biljetten ${normalizedRel} finns redan.`);
        return `AVVISAD: Biljettfilen '${normalizedRel}' existerar redan! Du får inte skriva över befintliga biljetter. Kontrollera doc/TICKETS.md och använd nästa lediga biljettnummer (t.ex. TCK-034).`;
      }

      // 🛑 MEKANISK SJÄLVKORRIGERING: Tvinga modellen att rätta sin egen kod i biljetten
      if (normalizedRel.startsWith('doc/.TICKETS/')) {
        const hasCodeBlock = content.includes('```typescript') || content.includes('```ts');
        const hasExportFunction = content.includes('export function');
        
        if (!hasCodeBlock || !hasExportFunction) {
          console.warn(`\n   ⛔ [VERKTYG AVVISADE BILJETT]: Modellen försökte använda fel designmönster. Tvingar självrättning...`);
          return "AVVISAD AV DÖRRVAKTEN: Biljetten MÅSTE innehålla ett ```typescript-kodblock med minst en 'export function'. Du får ALDRIG använda interfaces för tjänster (t.ex. TelemetryService) eller OOP-klasser i detta repo. Rätta koden omedelbart till fristående funktioner (export function) och Zod-scheman, och anropa save_file igen!";
        }
      }

      // 🛑 MEKANISK SPÄRR 3: Kontrollera Gherkin-krav
      if (normalizedRel.endsWith('.feature')) {
        if (!content.includes('# language: sv') || !content.includes('Scenario:')) {
          console.warn(`\n   ⛔ [VERKTYG AVVISADE GHERKIN]: Formateringsfel. Tvingar självrättning...`);
          return "AVVISAD: Gherkin-specifikationer MÅSTE skrivas på svenska med '# language: sv'. Om filen redan hade innehåll, måste du lägga till det nya scenariot utan att radera de gamla. Försök igen!";
        }
      }

      // Skriv filen till disk
      fs.mkdirSync(path.dirname(targetFullPath), { recursive: true });
      fs.writeFileSync(targetFullPath, content, 'utf-8');

      // Logga biljetten i masterloggen om den är ny
      if (normalizedRel.startsWith('doc/.TICKETS/')) {
        const ticketId = path.basename(normalizedRel).replace(/\.md$/, '');
      currentSessionTicket = ticketId;
        const masterLog = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
        if (fs.existsSync(masterLog)) {
          const raw = fs.readFileSync(masterLog, 'utf-8');
          if (!raw.includes(ticketId)) {
            fs.appendFileSync(masterLog, `- [ ] **${ticketId}**: (Skapad via samrad)\n`, 'utf-8');
          }
        }
      }

      console.log(`\n   💾 [SPARAD FIL]: ${normalizedRel} (${content.length} tecken)`);
      return `Filen ${normalizedRel} sparades framgångsrikt.`;
    }

    return `FEL: Okänt verktyg ${name}`; } catch (err: any) { return `Verktygsfel: ${err.message}`;
  }
}

const SAMRAD_TOOLS = [
  {
    name: 'read_file',
    behavior: 'NON_BLOCKING',
    description: 'Läser innehållet i en befintlig fil i repot. ANVÄND ALLTID INNAN DU SKRIVER!',
    parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' } }, required: ['file_path'] },
  },
  {
    name: 'save_file',
    behavior: 'NON_BLOCKING',
    description: 'Sparar filer. AVVISAS om du inte följer FSD-reglerna för export function!',
    parameters: { type: 'OBJECT', properties: { file_path: { type: 'STRING' }, content: { type: 'STRING' } }, required: ['file_path', 'content'] },
  },
];

async function main() {
  const args = process.argv.slice(2);
  const initialTopic = args.length > 0 ? args.join(' ') : 'Jag vill bygga en ny funktion.';

  console.log(`\n🌉 Välkommen till Mötesbryggan (v10.4)`);
  
  console.log(`💡 Vägvisaren är redo. Vad vill du att vi ska göra idag?\n`);

  let featureIndexStr = '';
  try { featureIndexStr = fs.readFileSync(path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json'), 'utf-8'); } catch {}

  const fence = String.fromCharCode(96).repeat(3);

  const systemInstruction = [
    'Du är Wayfinder i Outreach Coordination Engine v10.4.',
    'Ditt uppdrag är att agera brygga mellan en icke-programmerande domänexpert (användaren) och systemets strikta kodarkitektur.',
    'Användaren förklarar VAD systemet ska göra (mänsklig nytta). Du ansvarar HUNDRAPROCENTIGT för HUR det översätts till kod.',
    '',
    `Befintliga domäner: ${featureIndexStr}`,
    '',
    'ARKITEKTURANSVAR (DITT JOBB, INTE ANVÄNDARENS):',
    '1. Sökvägar i repot: All källkod ligger ALLTID under "src/features/[domän]/". Använd aldrig "features/..." utan "src/features/...".',
    '2. FSD-funktionalism: Du får ALDRIG skapa Service-klasser eller OOP-interfaces. All kod i detta repo bygger på fristående funktioner (export function) och Zod-scheman.',
    '3. Biljettlogistik: Kontrollera alltid doc/TICKETS.md för nästa lediga biljettnummer (just nu TCK-034). Spara biljetten till doc/.TICKETS/TCK-034.md.',
    '4. Gherkin MÅSTE skrivas på svenska (# language: sv) och sparas under doc/features/.',
    `5. Biljetten MÅSTE innehålla ett ${fence}typescript-kodblock med export function.`,
    '6. STRIKT ROLLGRÄNS: Du får ALDRIG skriva eller köra tester eller källkod inuti mötesbryggan! När biljetten och Gherkin-scenariot är sparade under doc/ är ditt uppdrag SLUTFÖRT. Be då användaren avsluta och köra ./bygg.sh TCK-034 i terminalen.',
    '',
    'PROCESS:',
    'Fråga användaren enbart om beteende och nytta. När ni är överens, anropa save_file för Gherkin och biljetten under doc/. Avsluta sedan turen.'
  ].join('\n');

  const session = new BidiLiveSession({
    ai,
    model: MODEL_NAME,
    systemInstruction,
    tools: SAMRAD_TOOLS,
    executeTool: executeSamradTool,
  });

  await session.connect();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const chatLoop = () => {
    rl.question('👤 Du: ', async (input) => {
      const trimmed = input.trim();
      if (trimmed.toLowerCase() === 'exit') {
        session.close();
        
        // Hitta om en biljett skapades under sessionen
        const ticketsDir = path.join(ROOT_DIR, 'doc', '.TICKETS');
        let latestTicket = '';
        let currentSessionTicket = '';
        if (fs.existsSync(ticketsDir)) {
          const files = fs.readdirSync(ticketsDir).filter(f => f.startsWith('TCK-') && f.endsWith('.md')).sort();
          latestTicket = files[files.length - 1]?.replace(/\.md$/, '') || '';
        }

        latestTicket = currentSessionTicket || latestTicket;
        if (latestTicket) {
          rl.question(`\n🚀 Samråd avslutat. Vill du starta det autonoma bygget för ${latestTicket} nu? (j/n): `, (ans) => {
            rl.close();
            if (ans.trim().toLowerCase() === 'j' || ans.trim().toLowerCase() === 'y') {
              console.log(`\n⚙️  Initierar maskinrummet för ${latestTicket}...\n`);
              execSync(`./bygg.sh ${latestTicket}`, { stdio: 'inherit', cwd: ROOT_DIR });
            }
            process.exit(0);
          });
          return;
        }

        rl.close();
        process.exit(0);
      }
      if (trimmed) {
        await session.send(trimmed, 120000);
        console.log('\n');
      }
      chatLoop();
    });
  };

  console.log(`👤 Du: (Initialt ämne) ${initialTopic}`);
  await session.send(initialTopic, 120000);
  console.log('\n');
  chatLoop();
}

main().catch(err => {
  console.error('\n💥 Samrådsfel:', err);
  process.exit(1);
});
