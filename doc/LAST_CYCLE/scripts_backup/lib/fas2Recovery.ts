import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { selectRelevantRetryFiles, extractErrorSignature } from './ticketAndAnchor.js';
import { planContextBatches, buildCrashDumpPayload } from './contextBatcher.js';
import { diagnostiseraRotOrsak } from './channelRunner.js';

export interface RecoveryState {
  innerAttempts: number;
  reversals: number;
}

const MAX_OUTER_REVERSALS = 4;
const MAX_INNER_ATTEMPTS = 3;

export async function korMaintValidering(ticketId: string, errorLog: string = ''): Promise<boolean> {
  let attempts = 0;
  let lastSignature = '';

  while (attempts < 4) {
    attempts++;
    console.log(`[Validation] Försök ${attempts}/4 för biljett ${ticketId}`);

    try {
      execSync(`npx tsx scripts/lib/maintValidation.ts --ticket ${ticketId}`, { stdio: 'inherit' });
      console.log(`[Validation] Lyckades vid försök ${attempts}`);
      return true;
    } catch (error: any) {
      console.error(`[Validation] Misslyckades vid försök ${attempts}:`, error.message);
      
      const currentSignature = extractErrorSignature(error.message);
      if (attempts > 1 && currentSignature && currentSignature === lastSignature) {
         console.warn(`[Validation] Samma fel upprepas. Avbryter för att förhindra oändlig loop.`);
         throw error;
      }
      lastSignature = currentSignature;

      await diagnostiseraRotOrsak(error, errorLog);

      if (attempts >= 4) {
        console.error(`[Validation] Maximalt antal försök uppnåddes. Avbryter.`);
        throw error;
      }
    }
  }
  return false;
}

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

    selectRelevantRetryFiles(contextData.changedFiles);
    planContextBatches('pass1');
  }

  try {
    console.log(`[Fas2Recovery] Kör om testerna...`);
    execSync(`npx vitest run ${contextData.testFile}`, { stdio: 'inherit' });
    
    console.log(`[Fas2Recovery] Test lyckades. Nollställer yttre omvändelser.`);
    state.reversals = 0;
    state.innerAttempts = 0;
  } catch (secondaryError: any) {
    console.error(`[Fas2Recovery] Omgående testkörning misslyckades också.`);
    return await hanteraFas2TestFel(secondaryError, state, contextData);
  }

  return state;
}

function diagnostiseraRotOrsak(error: any): void {
  console.log(`[Diagnostics] Analyserar fel...`);
  try {
    const decisionsPath = join(process.cwd(), 'doc', 'DECISIONS.md');
    if (existsSync(decisionsPath)) {
      const decisions = readFileSync(decisionsPath, 'utf-8');
      const adrMatches = decisions.match(/^## ADR-.*$/gm);
      if (adrMatches) {
        console.log(`[Diagnostics] Relevanta ADRs:`, adrMatches.join(', '));
      }
    }
  } catch (fsError) {
    console.warn(`[Diagnostics] Kunde inte läsa doc/DECISIONS.md`);
  }
}
*/
