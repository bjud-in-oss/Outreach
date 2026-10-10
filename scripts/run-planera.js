import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';

const ROOT_DIR = process.cwd();
const LAST_CYCLE_DIR = path.join(ROOT_DIR, 'doc', 'LAST_CYCLE');
const CYCLE_LOG_PATH = path.join(LAST_CYCLE_DIR, 'CYCLE_LOG.md');
const STATE_JSON_PATH = path.join(LAST_CYCLE_DIR, 'STATE.json');
const REQUIRED_TOKEN_PATH = path.join(LAST_CYCLE_DIR, 'REQUIRED_TOKEN.txt');

const CYCLE_SALT = process.env.OCE_HMAC_SECRET;

const STEP_SEQUENCE = [
  '1a', '0a', '0b',
  '1b', '2a', '2b', '2c', '2d',
  '3a', '3b', '2e', '3c'
];

export const CycleBlockInputSchema = z.object({
  step: z.enum(['1a', '0a', '0b', '1b', '2a', '2b', '2c', '2d', '3a', '3b', '2e', '3c']),
  ticket: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'REWIND', 'DECOMPOSED_ABORT']).default('APPROVED'),
  human_decision_required: z.boolean().default(false),
  rewind_to_step: z.enum(['1a', '0a', '0b', '1b', '2a', '2b', '2c', '2d', '3a', '3b', '2e', '3c']).optional()
}).superRefine((data, ctx) => {
  // Mekanisk spärr för Steg 3a: Kräver skarp TDD-kod (describe/it/test + expect)
  if (data.step === '3a' && data.status === 'APPROVED') {
    const lower = data.content.toLowerCase();
    const hasDescribeOrTest = lower.includes('describe(') || lower.includes('test(') || lower.includes('it(');
    const hasExpect = lower.includes('expect(');
    if (!hasDescribeOrTest || !hasExpect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '❌ [SPÄRR 3a] Steg 3a måste innehålla exekverbar TDD-testkod med describe()/it()/test() och expect().',
        path: ['content']
      });
    }
  }

  // Mekanisk spärr för Steg 3b: Kräver tillräcklig substans (> 150 tecken)
  if (data.step === '3b' && data.status === 'APPROVED') {
    if (data.content.trim().length < 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '❌ [SPÄRR 3b] Steg 3b saknar substans (måste innehålla exakt källkodsspecifikation > 150 tecken).',
        path: ['content']
      });
    }
  }
});

function calculateHMAC(data, prevHash) {
  return crypto.createHmac('sha256', CYCLE_SALT)
    .update(`${prevHash}:${data}`)
    .digest('hex')
    .substring(0, 16);
}

function ensureLastCycleDir() {
  if (!fs.existsSync(LAST_CYCLE_DIR)) {
    fs.mkdirSync(LAST_CYCLE_DIR, { recursive: true });
  }
}

function loadState() {
  if (fs.existsSync(STATE_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_JSON_PATH, 'utf8'));
    } catch {
      // Skapa ny om trasig
    }
  }
  return {
    ticket: null,
    completed_steps: [],
    current_hash: 'GENESIS',
    history: []
  };
}

function saveState(state) {
  ensureLastCycleDir();
  fs.writeFileSync(STATE_JSON_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function ensureTicketIndexed(ticket) {
  const ticketPath = path.join(ROOT_DIR, 'doc', '.TICKETS', `${ticket}.md`);
  
  if (!fs.existsSync(ticketPath)) {
    console.error(`❌ [FEL] Biljettfilen ${ticketPath} saknas. Skapa filen innan du kör planering.`);
    process.exit(1);
  }

  const ticketContent = fs.readFileSync(ticketPath, 'utf8');
  const titleMatch = ticketContent.match(/^#\s*(.+)$/m) || ticketContent.match(/^(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : ticket;

  const ticketsMdPath = path.join(ROOT_DIR, 'doc', 'TICKETS.md');
  let ticketsMd = fs.existsSync(ticketsMdPath) ? fs.readFileSync(ticketsMdPath, 'utf8') : '# TICKETS INDEX\n\n';

  const entryRegex = new RegExp(`\\[.*\\]\\s*:?\\s*${ticket}\\b.*`, 'gi');
  const newEntry = `[IN PROGRESS] ${ticket}: ${title}`;

  if (ticketsMd.match(entryRegex)) {
    ticketsMd = ticketsMd.replace(entryRegex, newEntry);
  } else {
    ticketsMd = ticketsMd.trim() + `\n- ${newEntry}\n`;
  }

  fs.writeFileSync(ticketsMdPath, ticketsMd, 'utf8');
  console.log(`📝 [INDEX] ${ticket} verifierad och uppdaterad i doc/TICKETS.md`);
}

export function updateCycleBlock(rawInput) {
  const parseResult = CycleBlockInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Ogiltigt anrop till update_cycle_block: ${parseResult.error.message}`
    };
  }

  const { step, ticket, content, status, human_decision_required, rewind_to_step } = parseResult.data;
  ensureLastCycleDir();

  let state = loadState();

  if (state.ticket !== ticket) {
    state = {
      ticket: ticket,
      completed_steps: [],
      current_hash: 'GENESIS',
      history: []
    };
    if (fs.existsSync(CYCLE_LOG_PATH)) {
      fs.unlinkSync(CYCLE_LOG_PATH);
    }
  }

  if (status === 'REWIND' && rewind_to_step) {
    const rewindIndex = STEP_SEQUENCE.indexOf(rewind_to_step);
    if (rewindIndex !== -1) {
      state.history = state.history.filter(item => STEP_SEQUENCE.indexOf(item.step) < rewindIndex);
      state.completed_steps = state.history.map(item => item.step);
      state.current_hash = state.history.length > 0 ? state.history[state.history.length - 1].hash : 'GENESIS';
      saveState(state);
      console.log(`🔄 [STATE] REWIND utförd till steg ${rewind_to_step}. HMAC-kedja avkortad.`);
    }
  }

  const stepHash = calculateHMAC(`${step}:${content}`, state.current_hash);

  let cycleLogContent = fs.existsSync(CYCLE_LOG_PATH) ? fs.readFileSync(CYCLE_LOG_PATH, 'utf8') : `# CYCLE LOG: ${ticket}\n\n`;
  const stepHeader = `## Steg ${step}`;

  if (cycleLogContent.includes(stepHeader)) {
    const regex = new RegExp(`## Steg ${step}[\\s\\S]*?(?=(## Steg |$))`, 'g');
    cycleLogContent = cycleLogContent.replace(regex, `${stepHeader}\n${content.trim()}\n\n`);
  } else {
    cycleLogContent += `${stepHeader}\n${content.trim()}\n\n`;
  }
  fs.writeFileSync(CYCLE_LOG_PATH, cycleLogContent, 'utf8');

  if (!state.completed_steps.includes(step)) {
    state.completed_steps.push(step);
  }
  state.current_hash = stepHash;
  state.history.push({
    step,
    hash: stepHash,
    timestamp: new Date().toISOString()
  });

  saveState(state);

  if (status === 'DECOMPOSED_ABORT') {
    if (fs.existsSync(REQUIRED_TOKEN_PATH)) fs.unlinkSync(REQUIRED_TOKEN_PATH);
    return {
      success: true,
      step,
      status: 'DECOMPOSED_ABORT',
      message: `Ticket ${ticket} avbruten i dörrvakten. Nedbrutna biljetter har skapats.`
    };
  }

  if (human_decision_required) {
    return {
      success: true,
      step,
      status: 'PAUSED_FOR_HUMAN',
      human_command: `pnpm planera ${ticket} --beslut="[DITT BESLUT HÄR]"`,
      message: `Pausad vid förlikningsport ${step}. Väntar på mänskligt beslut.`
    };
  }

  if (step === '3c' && status === 'APPROVED') {
    const finalToken = `${ticket}-VERIFIED-${stepHash}`;
    fs.writeFileSync(REQUIRED_TOKEN_PATH, finalToken, 'utf8');
    console.log(`🔑 [TOKEN] Slutgiltig token genererad: ${finalToken}`);
    return {
      success: true,
      step: '3c',
      status: 'APPROVED',
      token: finalToken,
      message: 'Fas 1 fullbordad. Token sparad i REQUIRED_TOKEN.txt.'
    };
  }

  return {
    success: true,
    step,
    status: 'APPROVED',
    hash: stepHash
  };
}

function runCLI() {
  const args = process.argv.slice(2);
  const targetTicket = args[0];

  if (!targetTicket) {
    console.log('📋 [PLANERA] Ingen ticket angiven. Läser PROMPT.md och aktiverar decomposing-tickets...');
    return;
  }

  ensureTicketIndexed(targetTicket);

  console.log(`🚀 [PLANERA] Redo för exekvering av Fas 1 för ${targetTicket}.`);
  console.log(`   State Machine redo för verifiering av update_cycle_block.`);
}

if (process.argv[1] && process.argv[1].endsWith('run-planera.js')) {
  runCLI();
}