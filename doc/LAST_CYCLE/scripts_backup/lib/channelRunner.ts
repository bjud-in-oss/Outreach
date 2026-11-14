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

export async function sparaMetaOmvandelse(
  ai: any,
  modelName: string,
  ticketId: string,
  errLog: string,
  si: string
): Promise<string> {
  const instruction = `Analysera varför den inre slingan i Fas 2 inte omvände sig framgångsrikt under sina 3 försök trots självrättningsinstruktioner. Vilken konstruktiv kritik eller arkitektonisk justering behöver genomföras?`;
  const startAnchor = `BILJETT: ${ticketId}\nFELLOGG:\n${errLog}`;
  
  return await runMicroChannel(
    ai,
    modelName,
    'Att vända om',
    instruction,
    startAnchor,
    si,
    [],
    undefined,
    { maxTurns: 1 }
  );
}

export function omprioriteraBatchForbattringar(improvementsPath: string): void {
  if (!fs.existsSync(improvementsPath)) return;
  const content = fs.readFileSync(improvementsPath, 'utf-8');
  const lines = content.split('\n');
  
  const headerIdx = lines.findIndex(l => l.trim() === '## 2. Köade Batch-förbättringar');
  if (headerIdx === -1) return;

  const nextHeaderIdx = lines.findIndex((l, i) => i > headerIdx && l.startsWith('## '));
  const improvementsSection = lines.slice(headerIdx + 1, nextHeaderIdx === -1 ? lines.length : nextHeaderIdx);
  
  const items = improvementsSection
    .map(l => l.trim())
    .filter(l => l.startsWith('- ') || l.startsWith('* '))
    .map(l => l.replace(/^[-*]\s+/, ''));
    
  const uniqueItems = Array.from(new Set(items));

  const weightMap: Record<string, number> = {
    '[PRIO: HOG]': 3,
    '[PRIO: MEDEL]': 2,
    '[PRIO: LAG]': 1
  };

  const getWeight = (item: string) => {
    for (const key in weightMap) {
      if (item.includes(key)) return weightMap[key];
    }
    return 0;
  };

  uniqueItems.sort((a, b) => getWeight(b) - getWeight(a));

  const newContentLines = lines.slice(0, headerIdx + 1);
  uniqueItems.forEach(item => newContentLines.push(`- ${item}`));
  if (nextHeaderIdx !== -1) {
    newContentLines.push(...lines.slice(nextHeaderIdx));
  }

  fs.writeFileSync(improvementsPath, newContentLines.join('\n'), 'utf-8');
}

export async function hanteraKonstruktivKritik(
  ai: any,
  modelName: string,
  ticketId: string,
  cycleSummary: string,
  si: string,
  improvementsPath: string
): Promise<{ harStorSkillnad: boolean; atgard: string }> {
  const prompt = `Utvärdera följande cykelsammanfattning och generera konstruktiv kritik eller systemförbättringar för Outreach Engine.
Om ingen verklig systemfriktion finns: svara enbart "INGEN_KRITIK".
Vid verklig friktion: Generera exakt följande format:
💡 Konstruktiv kritik av våra rutiner: [Observation & Konkret förslag]
BEDOMNING: STOR_SKILLNAD | LITEM_BATCH | AVVISAD_FELAKTIG
PRIORITET: HOG | MEDEL | LAG
MOTIVERING: ...

Cykel-sammanfattning:
${cycleSummary}
`;

  const response = await runMicroChannel(
    ai,
    modelName,
    'Att förlikas',
    prompt,
    `BILJETT: ${ticketId}`,
    si,
    [],
    undefined,
    { maxTurns: 1 }
  );

  if (response.includes('INGEN_KRITIK')) {
    return { harStorSkillnad: false, atgard: 'INGEN_KRITIK' };
  }

  const hardScoreMatch = response.match(/BEDOMNING:\s*(STOR_SKILLNAD|LITEM_BATCH|AVVISAD_FELAKTIG)/);
  const harStorSkillnad = hardScoreMatch ? hardScoreMatch[1] === 'STOR_SKILLNAD' : false;

  const kritikMatch = response.match(/💡 Konstruktiv kritik av våra rutiner:\s*(.+)/);
  constatgard = kritikMatch ? kritikMatch[1].trim() : '';

  const bedomningMatch = response.match(/BEDOMNING:\s*(.+)/);
  const bedomning = bedomningMatch ? bedomningMatch[1].trim() : '';

  if (bedomning === 'LITEM_BATCH' && atgard && fs.existsSync(improvementsPath)) {
    let improvContent = fs.readFileSync(improvementsPath, 'utf-8');
    const prioMatch = response.match(/PRIORITET:\s*(HOG|MEDEL|LAG)/);
    const prio = prioMatch ? `[PRIO: ${prioMatch[1]}] ` : '';
    const newEntry = `- ${prio}${atgard}`;
    
    if (!improvContent.includes(atgard)) {
       const headerIdx = improvContent.indexOf('## 2. Köade Batch-förbättringar');
       if (headerIdx !== -1) {
         const nextHeaderIdx = improvContent.indexOf('## ', headerIdx + 3);
         const before = improvContent.slice(0, headerIdx + 30);
         const after = nextHeaderIdx !== -1 ? improvContent.slice(nextHeaderIdx) : '';
         improvContent = `${before}\n${newEntry}\n${after}`;
       } else {
         improvContent += `\n## 2. Köade Batch-förbättringar\n${newEntry}\n`;
       }
       fs.writeFileSync(improvementsPath, improvContent, 'utf-8');
       omprioriteraBatchForbattringar(improvementsPath);
    }
  } else if (bedomning === 'AVVISAD_FELAKTIG' && atgard) {
     let improvContent = fs.existsSync(improvementsPath) ? fs.readFileSync(improvementsPath, 'utf-8') : '';
     const newEntry = `- [AVVISAD] ${atgard}`;
     const headerIdx = improvContent.indexOf('## 3. Avvisade & Vederlagda Förslag');
     if (headerIdx !== -1) {
        const nextHeaderIdx = improvContent.indexOf('## ', headerIdx + 3);
        const before = improvContent.slice(0, headerIdx + 35);
        const after = nextHeaderIdx !== -1 ? improvContent.slice(nextHeaderIdx) : '';
        improvContent = `${before}\n${newEntry}\n${after}`;
     } else {
        improvContent += `\n## 3. Avvisade & Vederlagda Förslag\n${newEntry}\n`;
     }
     fs.writeFileSync(improvementsPath, improvContent, 'utf-8');
  }

  return { harStorSkillnad, atgard };
}
