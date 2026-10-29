/**
 * scripts/samrad.ts
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Självgående, arkitekturmedvetet samråd för icke-programmerande domänexperter.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
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

      // 🛑 MEKANISK SJÄLVKORRIGERING: Tvinga modellen att rätta sin egen kod
      if (relPath.includes('doc/.TICKETS/')) {
        const hasCodeBlock = content.includes('```typescript') || content.includes('```ts');
        const hasExportFunction = content.includes('export function');
        
        if (!hasCodeBlock || !hasExportFunction) {
          console.warn(`\n   ⛔ [VERKTYG AVVISADE BILJETT]: Modellen försökte använda fel designmönster. Tvingar självrättning...`);
          return "AVVISAD AV DÖRRVAKTEN: Biljetten MÅSTE innehålla ett ```typescript-kodblock med minst en 'export function'. Du får ALDRIG använda interfaces för tjänster (t.ex. TelemetryService) eller OOP-klasser i detta repo. Rätta koden omedelbart till fristående funktioner (export function) och Zod-scheman, och anropa save_file igen!";
        }
      }

      if (relPath.endsWith('.feature')) {
        if (!content.includes('# language: sv') || !content.includes('Scenario:')) {
          console.warn(`\n   ⛔ [VERKTYG AVVISADE GHERKIN]: Formateringsfel. Tvingar självrättning...`);
          return "AVVISAD: Gherkin-specifikationer MÅSTE skrivas på svenska med '# language: sv'. Om filen redan hade innehåll, måste du lägga till det nya scenariot utan att radera de gamla. Försök igen!";
        }
      }

      const fullPath = path.resolve(ROOT_DIR, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');

      // Logga biljetten i masterloggen
      if (relPath.includes('doc/.TICKETS/')) {
        const ticketId = path.basename(relPath).replace(/\.md$/, '');
        const masterLog = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
        if (fs.existsSync(masterLog)) {
          const raw = fs.readFileSync(masterLog, 'utf-8');
          if (!raw.includes(ticketId)) {
            fs.appendFileSync(masterLog, `- [ ] **${ticketId}**: (Skapad via samrad)\n`, 'utf-8');
          }
        }
      }

      console.log(`\n   💾 [SPARAD FIL]: ${relPath} (${content.length} tecken)`); return `Filen ${relPath} sparades framgångsrikt.`;
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
    '1. Du MÅSTE undersöka befintliga filer (read_file på doc/DECISIONS.md, doc/SI_v10.4.md och doc/features/[domän].feature) innan du föreslår lösningar.',
    '2. FSD-funktionalism: Du får ALDRIG skapa Service-klasser eller OOP-interfaces. All kod i detta repo bygger på fristående funktioner (export function) och Zod-scheman.',
    '3. Körtidsankare: Funktioner som rör telemetri eller händelser MÅSTE emittera till SwarmEventBus och returnera { success: true, event: [ZodType] }.',
    '4. Gherkin MÅSTE skrivas på svenska (# language: sv). Raderar du gamla scenarier i feature-filen gör du fel.',
    `5. Spara biljetten till doc/.TICKETS/[TCK-XXX].md. Den MÅSTE innehålla ett ${fence}typescript-kodblock med export function.`,
    '',
    'PROCESS:',
    'Fråga användaren enbart om beteende och nytta. När ni är överens, ta fullt ansvar för att anropa save_file med perfekt formaterad TypeScript och Gherkin.'
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
