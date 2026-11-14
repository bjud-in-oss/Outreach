import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// --- Types ---
export interface RecoveryState {
  reversals: number;
  innerAttempts: number;
}

export interface CrashDumpPayload {
  failedFile: string;
  error: string;
  astMetrics: any;
  timestamp: string;
}

// --- Constants ---
const MAX_OUTER_REVERSALS = 4;
const MAX_INNER_ATTEMPTS = 3;

/**
 * Utför maintenace validering via maintValidation.ts
 * Inkluderar framstegsspärr, kompakt ADR-loggning och feldiagnostik.
 */
export async function korMaintValidering(ticketId: string): Promise<boolean> {
  let attempts = 0;

  while (attempts < 4) {
    attempts++;
    console.log(`[Validation] Försök ${attempts}/4 för biljett ${ticketId}`);

    try {
      // Kör maintValidation via tsx
      execSync(`npx tsx scripts/lib/maintValidation.ts --ticket ${ticketId}`, { stdio: 'inherit' });
      console.log(`[Validation] Lyckades vid försök ${attempts}`);
      return true;
    } catch (error: any) {
      console.error(`[Validation] Misslyckades vid försök ${attempts}:`, error.message);
      
      // Diagnostisera rotorsak (simulerad logik för detta scope)
      diagnostiseraRotOrsak(error);

      if (attempts >= 4) {
        console.error(`[Validation] Maximalt antal försök uppnåddes. Avbryter.`);
        throw error;
      }
    }
  }
  return false;
}

/**
 * Hanterar fel under fas 2 testkörningar (Vitest + AST Gate 2c)
 */
export async function hanteraFas2TestFel(
  error: any, 
  state: RecoveryState, 
  contextData: any
): Promise<RecoveryState> {
  console.error(`[Fas2Recovery] Hanterar testfel. Inre spår: ${state.innerAttempts}, Yttre spår: ${state.reversals}`);

  state.innerAttempts++;

  if (state.innerAttempts > MAX_INNER_ATTEMPTS) {
    console.warn(`[Fas2Recovery] Inre försök förbrukade. Eskalerar till yttre omvändelse.`);
    state.innerAttempts = 0;
    state.reversals++;

    if (state.reversals > MAX_OUTER_REVERSALS) {
      console.error(`[Fas2Recovery] Yttre omvändelsegräns överskriden. Kritisk krasch.`);
      
      const crashDump = buildCrashDumpPayload(contextData.failedFile, error);
      writeFileSync(join(process.cwd(), 'CRASH_DUMP.json'), JSON.stringify(crashDump, null, 2));
      
      throw new Error(`Kritisk fel under Fas 2 återhämtning: ${error.message}`);
    }

    // Utför yttre omvändelse: selectRelevantRetryFiles och planContextBatches
    selectRelevantRetryFiles(contextData.changedFiles);
    planContextBatches('pass1');
  }

  // Försök köra om testerna
  try {
    console.log(`[Fas2Recovery] Kör om testerna...`);
    execSync(`npx vitest run ${contextData.testFile}`, { stdio: 'inherit' });
    
    // Nollställ omvändelse vid lyckad körning
    console.log(`[Fas2Recovery] Test lyckades. Nollställer yttre omvändelser.`);
    state.reversals = 0;
    state.innerAttempts = 0;
  } catch (secondaryError: any) {
    console.error(`[Fas2Recovery] Omgående testkörning misslyckades också.`);
    return await hanteraFas2TestFel(secondaryError, state, contextData);
  }

  return state;
}

// --- Hjälpfunktioner ---

function diagnostiseraRotOrsak(error: any): void {
  console.log(`[Diagnostics] Analyserar fel...`);
  // Läs och logga ADR-rubriker ur DECISIONS.md för kontext
  try {
    const decisions = readFileSync(join(process.cwd(), 'doc', 'DECISIONS.md'), 'utf-8');
    const adrMatches = decisions.match(/^## ADR-.*$/gm);
    if (adrMatches) {
      console.log(`[Diagnostics] Relevanta ADRs:`, adrMatches.join(', '));
    }
  } catch (fsError) {
    console.warn(`[Diagnostics] Kunde inte läsa doc/DECISIONS.md`);
  }
}

function buildCrashDumpPayload(failedFile: string, error: any): CrashDumpPayload {
  return {
    failedFile,
    error: error.message || String(error),
    astMetrics: {}, // Kan utökas vid behov
    timestamp: new Date().toISOString()
  };
}

function selectRelevantRetryFiles(changedFiles: string[]): void {
  console.log(`[Recovery] Väljer relevanta filer för retry:`, changedFiles);
}

function planContextBatches(pass: 'pass1' | 'pass2'): void {
  console.log(`[Recovery] Planerar batch kontext: ${pass}`);
}
