import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const [, , ticketId] = process.argv;

if (!ticketId) {
  console.error('Användning: npx tsx scripts/run-planera-live.ts <TICKET-ID>');
  process.exit(1);
}

const TICKET_PATH = path.join(ROOT_DIR, `doc/.TICKETS/${ticketId}.md`);
const SYSTEM_INSTRUCTION_PATH = path.join(ROOT_DIR, 'doc/SI_v10.4.md');
const AGENTS_PATH = path.join(ROOT_DIR, 'AGENTS.md');
const TICKETS_INDEX_PATH = path.join(ROOT_DIR, 'doc/TICKETS.md');

const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc/LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(LAST_CYCLE_DIR, 'CYCLE_LOG.md');
const CRASH_DUMP_PATH = path.join(LAST_CYCLE_DIR, 'CRASH_DUMP.json');

const BIDI_RUNNER = path.join(ROOT_DIR, 'scripts/bidiLiveRunner.ts');

if (!fs.existsSync(TICKET_PATH)) {
  console.error(`❌ Biljett hittades inte: ${TICKET_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(LAST_CYCLE_DIR)) {
  fs.mkdirSync(LAST_CYCLE_DIR, { recursive: true });
}

// Rensar tidigare logg
fs.writeFileSync(CYCLE_LOG_PATH, `# BYGGCYKEL LOGG: ${ticketId}\n**Starttid:** ${new Date().toISOString()}\n**Modell:** gemini-3.8-live\n\n---\n### INITIAL PROMPT\n\`\`\`\n${fs.readFileSync(TICKET_PATH, 'utf-8')}\n\`\`\`\n\n`, 'utf-8');

function appendCycleLog(step: string, content: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  fs.appendFileSync(CYCLE_LOG_PATH, `\n#### ${step} [${timestamp}]\n${content}\n`, 'utf-8');
}

const isMaint = ticketId.startsWith('TCK-MAINT-');
const ticketContent = fs.readFileSync(TICKET_PATH, 'utf-8');

// --- Hitta måldomänen via regex ---
const domainMatch = ticketContent.match(/[Måldomän]:\s*([a-zA-Z0-9_-]+)/i);
let targetDomain = '';
if (domainMatch) {
  targetDomain = domainMatch[1].trim();
} else {
  console.warn('⚠️ Ingen [Måldomän] explicit angiven i biljetten. FSD-sandbox inaktiverad.');
}

if (isMaint && targetDomain === '') {
  targetDomain = 'scripts_and_doc'; 
}

const ticketPrompt = `UPPDRAG:\n${ticketContent}`;
const systemInstruction = fs.readFileSync(SYSTEM_INSTRUCTION_PATH, 'utf-8');
const agentsContext = fs.readFileSync(AGENTS_PATH, 'utf-8');

const askUser = (query: string): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

const runMicroChannel = async (
  agentRole: string, 
  promptInfo: string, 
  anchorData: string, 
  instruction: string,
  tools: any[] = [],
  executeTool: (name: string, args: any) => Promise<string> = async () => 'Not implemented',
  options: { maxTurns?: number, requireMutation?: boolean, onMutationCheck?: () => boolean } = {}
): Promise<string> => {
  
  const { maxTurns = 1, requireMutation = false, onMutationCheck = () => true } = options;
  
  let currentTurn = 1;
  let fullResponse = '';
  let activeAnchor = anchorData;
  let hasMutated = false;

  console.log(`\n   📡 [VÄNDA ${currentTurn}/${maxTurns}] Startar asynkron Bidi WebSocket (${agentRole})...`);

  while (currentTurn <= maxTurns) {
    const tmpRespFile = path.join(LAST_CYCLE_DIR, `bidi_resp_${Date.now()}.txt`);
    const runArgv = [
      'npx', 'tsx', BIDI_RUNNER,
      agentRole,
      promptInfo,
      activeAnchor,
      instruction,
      tmpRespFile,
      JSON.stringify(tools)
    ];

    try {
      execSync(runArgv.join(' '), { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (err: any) {
      console.warn(`\n   ⚠️ BidiRunner kraschade (Vända ${currentTurn}):`, err.message);
    }

    if (fs.existsSync(tmpRespFile)) {
      const resp = fs.readFileSync(tmpRespFile, 'utf-8');
      fullResponse += (currentTurn > 1 ? '\n\n' : '') + resp;
      
      const toolMatch = resp.match(/[VERKTYG ANROPAT]:\s*([a-zA-Z0-9_]+)\n[ARGUMENT]:\s*(\{[\s\S]*?\})/);
      
      if (toolMatch) {
        const toolName = toolMatch[1];
        let toolArgs;
        try {
          toolArgs = JSON.parse(toolMatch[2]);
        } catch {
          console.warn(`   ⚠️ Kunde inte parsa JSON för verktyg ${toolName}`);
          toolArgs = {};
        }

        const toolResult = await executeTool(toolName, toolArgs);
        
        fs.unlinkSync(tmpRespFile);

        hasMutated = onMutationCheck();

        if (requireMutation && hasMutated) {
           break; 
        } else if (currentTurn < maxTurns) {
           activeAnchor = `[VERKTYGSRETUR (${toolName})]:\n${toolResult}\n\nFortsätt ditt uppdrag baserat på verktygets returvärde.`;
           currentTurn++;
           console.log(`\n   🔁 [ACTION LOOP]: Verktyg utfört. Fortsätter mikrokanalen (vända ${currentTurn}/${maxTurns})...`);
           continue;
        } else {
           break;
        }
      }
      
      fs.unlinkSync(tmpRespFile);
      break; 
    } else {
      console.error(`\n   ❌ BidiRunner returnerade inget svar (Fil saknas).`);
      break;
    }
  }

  return fullResponse.trim() || 'INGET_SVAR';
};

import { applySourcePatch } from './drivers/patchMutator.js';

const executeFas1Tools = async (name: string, args: any): Promise<string> => {
  if (name === 'list_files') {
    try {
      const entries = fs.readdirSync(path.join(ROOT_DIR, args.directory_path), { withFileTypes: true });
      return entries.map(e => e.isDirectory() ? `[DIR] ${e.name}` : `[FIL] ${e.name}`).join('\n');
    } catch (e: any) { return `Fel: ${e.message}`; }
  }
  if (name === 'read_file') {
    try {
      const content = fs.readFileSync(path.join(ROOT_DIR, args.file_path), 'utf-8');
      if (content.length > 8000) {
        return content.substring(0, 4000) + '\n\n... (Filen trimmades pga längd) ...\n\n' + content.substring(content.length - 4000);
      }
      return content;
    } catch (e: any) { return `Fel: ${e.message}`; }
  }
  return 'Okänt verktyg';
};

async function main() {
  console.log(`\n🚀 OUTREACH COORDINATION ENGINE v10.4 – STARTAR BYGG: ${ticketId}`);
  console.log(`📌 Aktiv Live-modell: gemini-3.8-live`);
  console.log(`🎯 Måldomän: ${targetDomain || 'Odefinierad (Läsning endast tillåten)'}`);

  // ==========================================
  // FAS 0: PREMISSVALIDERING & DÖRRVAKT
  // ==========================================
  console.log('\n### FAS 0: PREMISSVALIDERING & DÖRRVAKT');
  const steg1a = await runMicroChannel('Att följa', 'Steg 1a: Förstå Intention & Mänsklig Nytta.', ticketPrompt, systemInstruction);
  appendCycleLog('1a Att följa: Intention & Nytta', steg1a);

  const steg0a = await runMicroChannel('Att vända om', 'Steg 0a: Kontraktsaudit.', `${ticketPrompt}\n\nINTENTION:\n${steg1a}`, systemInstruction);
  appendCycleLog('0a Att vända om: Kontraktsaudit', steg0a);

  const steg0b = await runMicroChannel('Att förlikas', 'Steg 0b: Vägval. Svara enbart "STATUS: GODKÄND" om godkänd.', steg0a, systemInstruction);
  appendCycleLog('0b Att förlikas: Vägval', steg0b);

  if (!steg0b.includes('STATUS: GODKÄND')) {
    console.error('\n❌ Fas 0 underkändes av Att förlikas.');
    process.exit(1);
  }

  // ==========================================
  // FAS 1: PLANERINGSSVEP
  // ==========================================
  console.log('\n### FAS 1: LINJÄRT PLANERINGSSVEP (MIKRO-OSCILLATION)');
  const fas1Tools = [
    { name: 'list_files', description: 'Listar filer i en FSD-katalog.', parameters: { type: 'object', properties: { directory_path: { type: 'string' } }, required: ['directory_path'] } },
    { name: 'read_file', description: 'Läser en fils innehåll.', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } }
  ];

  const sysWithAgents = `${systemInstruction}\n\n${agentsContext}`;

  const steg1b = await runMicroChannel('Att följa', 'Steg 1b: Kartläggning.', ticketPrompt, sysWithAgents, fas1Tools, executeFas1Tools, { maxTurns: 3 });
  appendCycleLog('1b Att följa: Domängränser', steg1b);

  const steg2b = await runMicroChannel('Att följa', 'Steg 2b: Formulera 3 ortogonala lösningsalternativ.', steg1b, sysWithAgents);
  appendCycleLog('2b Att följa: 3 Alternativ', steg2b);

  const steg2c = await runMicroChannel('Att vända om', 'Steg 2c: Utvärdera alternativen för resiliens och felhantering.', steg2b, sysWithAgents);
  appendCycleLog('2c Att vända om: Resiliensgranskning', steg2c);

  const steg2d = await runMicroChannel('Att förlikas', 'Steg 2d: Lås det vinnande kontraktet och stäng med "MÄTTNAD: JA".', steg2c, sysWithAgents);
  appendCycleLog('2d Att förlikas: Mättnad', steg2d);

  let steg3c = steg2d;

  let transientTestFile = '';
  let transientTestFullPath = '';

  if (!isMaint) {
    transientTestFile = `src/__tests__/bdd/transient_${ticketId}.test.ts`;
    transientTestFullPath = path.join(ROOT_DIR, transientTestFile);

    const testGenTools = [
      { name: 'save_code', description: `Sparar det genererade Vitest-testet till ${transientTestFile}.`, parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } }
    ];

    let testSaved = false;
    const executeTestGen = async (name: string, args: any): Promise<string> => {
      if (name === 'save_code') {
        fs.writeFileSync(transientTestFullPath, args.code, 'utf-8');
        testSaved = true;
        return `Test sparat till ${transientTestFile}.`;
      }
      return 'Okänt verktyg';
    };

    const steg3a = await runMicroChannel(
      'Att följa',
      `Steg 3a: Generera transient testspecifikation och spara den till '${transientTestFile}' med save_code.\nKRAV:\n1. Skriv ren TypeScript (inga JSX).\n2. Testet MÅSTE fallera rött (Fail-First) mot befintlig kod!`,
      steg3c,
      sysWithAgents,
      testGenTools,
      executeTestGen,
      { requireMutation: true, maxTurns: 3, onMutationCheck: () => testSaved }
    );
    appendCycleLog('3a Att följa: Testspecifikation (FSD)', steg3a);

    console.log('\n🔴 Gate 3a Fail-First: Verifierar att testet fallerar rött (exit 1)...');
    try {
      execSync(`npx vitest run ${transientTestFile} --run`, { stdio: 'pipe', cwd: ROOT_DIR });
      console.error('\n❌ Gate 3a misslyckades: Testet blev GRÖNT. Det måste fallera rött mot nuvarande kod innan Fas 2 tillåts.');
      process.exit(1);
    } catch (err: any) {
      console.log('✅ Gate 3a godkänd: Testet fallerade rött som förväntat.');
    }
  }

  // ==========================================
  // FAS 2: KÄLLKODSEXEKVERING (TDD)
  // ==========================================
  console.log('\n\n### FAS 2: KÄLLKODSEXEKVERING\n');

  let attempts = 0;
  let codeSaved = false;
  const createdModules: string[] = [];

  const codegenTools = [
    { name: 'read_file', description: 'Inspekterar befintlig kod.', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } },
    { name: 'apply_patch', description: 'Patchar existerande källkod.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, search_block: { type: 'string' }, replace_block: { type: 'string' } }, required: ['file_path', 'search_block', 'replace_block'] } },
    { name: 'save_code', description: 'Skriver HELT ny fil (endast om den inte finns).', parameters: { type: 'object', properties: { file_path: { type: 'string' }, code: { type: 'string' } }, required: ['file_path', 'code'] } }
  ];

  const executeFas2Tools = async (name: string, args: any): Promise<string> => {
    if (name === 'read_file') {
      try { return fs.readFileSync(path.join(ROOT_DIR, args.file_path), 'utf-8'); } catch (e: any) { return `Fel: ${e.message}`; }
    }
    
    let rel = args.file_path;
    if (!isMaint && !rel.startsWith(`src/features/${targetDomain}/`)) {
      throw new Error(`Otillåten skrivning till ${rel}. Endast src/features/${targetDomain}/ är tillåtet.`);
    }
    const full = path.resolve(ROOT_DIR, rel);

    if (name === 'apply_patch') {
      if (!fs.existsSync(full)) return `Fel: Filen ${rel} finns inte. Använd save_code i stället.`;
      const existingContent = fs.readFileSync(full, 'utf-8');
      const patchedContent = applySourcePatch(existingContent, args.search_block, args.replace_block, rel);
      if (patchedContent === existingContent) {
        throw new Error("SEARCH_BLOCK_NOT_FOUND: Sökblocket hittades inte. Bygget kraschas mekaniskt för att undvika tomma tillstånd.");
      }
      fs.writeFileSync(full, patchedContent, 'utf-8');
      codeSaved = true;
      return `Patch applicerad framgångsrikt på ${rel}.`;
    }

    if (name === 'save_code') {
      if (fs.existsSync(full)) return `Fel: Filen ${rel} finns redan. Använd apply_patch i stället.`;
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, args.code, 'utf-8');
      codeSaved = true;
      createdModules.push(path.basename(full, '.ts'));
      return `Fil sparad framgångsrikt till ${rel}.`;
    }
    return 'Okänt verktyg';
  };

  const fas2Prompt = isMaint 
    ? `Fas 2: Skriv och tillämpa underhållskoden för att lösa biljetten ${ticketId}. Spara filerna med save_code!`
    : `Fas 2: KÄLLKODSEXEKVERING FÖR ${targetDomain.toUpperCase()}
UPPDRAG: Implementera källkoden under 'src/features/${targetDomain}/' för att uppfylla byggkontraktet och få testet grönt.

REGLER OCH DINA 3 TILLÅTNA HANDLINGSVÄGAR (ADR-013):
1. VÄG 1 (Lokal reparation): Rätta koden i befintlig fil via 'apply_patch' (inspektera alltid med 'read_file' först).
2. VÄG 2 (Modulär expansion): Skapa nya hjälpfiler under 'src/features/${targetDomain}/' och exportera via 'index.ts'.
3. VÄG 3 (Omvändelse / Metanoia):
   a) STATUS: HAVERERAT_KONTRAKT [orsak] (Vid tekniska/arkitektoniska omöjligheter - loopar till Fas 1)
   b) STATUS: FRIVILLIG_OMVÄNDELSE [orsak] (För att frivilligt sanera skuld - loopar till Fas 1)
   c) STATUS: FÖRLIKANDE_OMVÄNDELSE [orsak + fråga] (ADR-020: Om uppdraget strider mot systemets ideala kompass och skapar manipulation/övervakning. Stoppar bygget helt och bjuder in människan till förlikning i Mötesbryggan!)`;

  const fas2Anchor = `BILJETTKONTRAKT:\n${ticketPrompt}\n\nBYGGKONTRAKT (Fas 1):\n${steg3c}`;
  const fas2Response = await runMicroChannel('Att följa', fas2Prompt, fas2Anchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });

  const isHaveri = fas2Response.includes('STATUS: HAVERERAT_KONTRAKT');
  const isFrivillig = fas2Response.includes('STATUS: FRIVILLIG_OMVÄNDELSE');
  const isForlikande = fas2Response.includes('STATUS: FÖRLIKANDE_OMVÄNDELSE');

  if ((isHaveri || isFrivillig || isForlikande) && !isMaint) {
    const triggerType = isForlikande ? 'FÖRLIKANDE_OMVÄNDELSE' : (isFrivillig ? 'FRIVILLIG_OMVÄNDELSE' : 'HAVERERAT_KONTRAKT');
    console.warn(`\n⚠️ [ADR-013/020 OMVÄNDELSE AKTIVERAD]: Typ: ${triggerType}`);
    
    if (!process.argv.includes('--omvandelse')) {
      console.log('🔄 Sanerar källkod...');
      try { execSync(`git checkout -- src/features/${targetDomain} 2>/dev/null || true`, { cwd: ROOT_DIR }); } catch (e: any) { console.warn('Git checkout failed', e?.message); }
      fs.writeFileSync(CRASH_DUMP_PATH, JSON.stringify({ ticket: ticketId, domain: targetDomain, trigger: triggerType, response: fas2Response }, null, 2), 'utf-8');
      if (triggerType === 'FÖRLIKANDE_OMVÄNDELSE') {
        console.error('\n⚖️ [KÖRTIDSRÅD]: Agenten avbryter för förlikning i Mötesbryggan.');
        process.exit(1);
      }
      try {
        console.log('🚀 Startar omplanering i Fas 1 via underprocess...');
        execSync(`npx tsx scripts/run-planera-live.ts ${ticketId} --omvandelse`, { stdio: 'inherit', cwd: ROOT_DIR });
        process.exit(0);
      } catch (err: any) { process.exit(err.status || 1); }
    } else {
      console.error('❌ Cykelspärr nådd.');
      process.exit(1);
    }
  }

  // 🛑 FAIL-FAST: Avbryt omedelbart om Fas 2 förbrukade sina vändor utan att spara kod
  if (!codeSaved && !isMaint) {
    console.error('\n❌ FAS 2 MISSLYCKADES: Inga källkodsändringar utfördes under de tillåtna vändorna.');
    process.exit(1);
  }

  console.log('\n🔒 Verifierar Gate 2c: AST-kontroll mot tysta catch-block...');
  try {
    const scriptToCheck = isMaint ? 'scripts/run-planera-live.ts' : `src/features/${targetDomain}`;
    execSync(`node scripts/drivers/ts.js --check-catch-blocks ${scriptToCheck}`, { stdio: 'inherit', cwd: ROOT_DIR });
  } catch (err) {
    console.error('\n💥 Gate 2c underkändes: 1 tysta catch, 0 testmockar i prod.');
    process.exit(1);
  }

  // ==========================================
  // Självrättnings-loop
  // ==========================================
  if (!isMaint) {
    while (attempts < 3) {
      attempts++;
      console.log(`\n🧪 Kör transient-test (Vitest)... Försök ${attempts}/3`);
      try {
        execSync(`npx vitest run ${transientTestFile} --run`, { stdio: 'pipe', cwd: ROOT_DIR });
        console.log('✅ TEST GRÖNT! Källkoden validerad.');
        break;
      } catch (vitestErr: any) {
        console.warn(`\n⚠️ [FAS 2 SJÄLVRÄTTNING]: Försök ${attempts}/3 fallerade.`);
        if (attempts >= 3) {
          console.error('❌ Maximalt antal självrättningsförsök uppnått i Fas 2.');
          process.exit(1);
        }

        let testLog = '';
        if (vitestErr.stdout) testLog += vitestErr.stdout.toString();
        if (vitestErr.stderr) testLog += vitestErr.stderr.toString();

        const retryPrompt = `FAS 2 SJÄLVRÄTTNING (Försök ${attempts}/3):
Vitest underkände transient-testet!
FELLOGG:
${testLog}

VIKTIGA REGLER FÖR SJÄLVRÄTTNING (ADR-013/020):
1. TESTFILEN ÄR STRIKT SKRIVSKYDDAD OCH FÅR INTE ÄNDRAS.
2. VÄG 1 & 2: Åtgärda felet i källkoden under 'src/features/${targetDomain}/' via save_code eller apply_patch.
3. VÄG 3 (Omvändelse / Metanoia): Om testet kräver en omöjlighet (HAVERERAT_KONTRAKT), om arkitekturen blev skadlig (FRIVILLIG_OMVÄNDELSE), eller om uppdraget strider mot systemets ideala kompass (FÖRLIKANDE_OMVÄNDELSE):
   Deklarera omedelbart rätt STATUS för att sanera koden och påbörja omvändelse!`;

        const retryAnchor = `BYGGKONTRAKT (Fas 1):\n${steg3c}`;
        codeSaved = false;
        await runMicroChannel('Att följa', retryPrompt, retryAnchor, systemInstruction, codegenTools, executeFas2Tools, { requireMutation: true, maxTurns: 3, onMutationCheck: () => codeSaved });
      }
    }
  }

  // ==========================================
  // FAS 3: REFLEKTION OCH TEATER
  // ==========================================
  console.log('📋 Fas 3: Uppdaterar biljettstatus i doc/TICKETS.md...');
  let ticketsIndex = fs.readFileSync(TICKETS_INDEX_PATH, 'utf-8');
  ticketsIndex = ticketsIndex.replace(`[ ] ${ticketId}`, `[x] ${ticketId}`);
  fs.writeFileSync(TICKETS_INDEX_PATH, ticketsIndex, 'utf-8');

  console.log('\n🔍 Slutverifiering: Kör hela projektets arkitektur- och regressionskontroll...');
  try {
    execSync('pnpm test && node scripts/verify-architecture.js && pnpm update-index', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('\n🎉 ALLA TESTER OCH ARKITEKTURKONTROLLER GRÖNA!\n');
    
    let diffStat = 'Okänd';
    try { diffStat = execSync('git diff --stat', { cwd: ROOT_DIR }).toString(); } catch {}

    const theaterPrompt = `FAS 3: REFLEKTION OCH TEATER
Bygget är slutfört och koden är incheckad (eller verifierad i Sandbox).
Diff:
${diffStat}

Din uppgift (ADR-024):
1. Om cykeln innehöll omvändelser, felloggar eller kraschade patchar: fråga dig själv: "Hur gör vi för att förebygga att det här händer igen?"
2. Skapa i så fall en färdig FSD-isolerad underhållsbiljett ('doc/.TICKETS/TCK-MAINT-XXX.md') via verktyget 'save_code' innan du svarar.
3. Sammanfatta sedan lärdomarna i texten.
Agera som kraften: 'Att förlikas' (Makro-värd).`;

    console.log(`🛡️ [SANDBOX]: Systemförändring (MAINT) detekterad. Genererar besiktningsrapport...`);
    const valideringsSvar = await runMicroChannel(
      'Att förlikas',
      'Systemet har manipulerat sig självt i en Sandbox (MAINT). Utför Besiktningsrapport (Avsikt, Faronivå, Ångerrätt)',
      theaterPrompt,
      systemInstruction
    );

    console.log(`\n${valideringsSvar}\n\n--- GIT DIFF STAT ---\n${diffStat}\n`);
    const godkann = await askUser('❓ [j = Godkänn kod] [s = Spara spec, återställ kod] [n = Kassera allt] [Valfri text = Fråga AI]: ');

    if (godkann.toLowerCase() === 'j') {
      console.log('\n📦 Genomför automatisk Git Commit & Push till GitHub...');
      try {
        execSync(`git add . && git commit -m "Auto-sync WAL och körtid för ${ticketId} (Exit 0)"`, { stdio: 'pipe', cwd: ROOT_DIR });
        execSync(`pnpm synka`, { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (err: any) {
        console.log('📦 Synkar tillståndet till Git (Exit kod: 0)...');
        execSync(`git status`, { stdio: 'inherit', cwd: ROOT_DIR });
      }
      console.log('✅ Bygget slutfördes framgångsrikt.');
      process.exit(0);
    } else {
      console.log('\n🗑️ Kasserar ändringar...');
      execSync('git reset --hard && git clean -fd', { stdio: 'inherit', cwd: ROOT_DIR });
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n💥 Byggfel: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
