import * as fs from 'fs';
import * as path from 'path';

export type { SourceManifestEntry, BatchPlan } from './contextBatcher.js';
export { buildSourceManifest, planContextBatches, buildCrashDumpPayload } from './contextBatcher.js';

export function getRequiredFiles(ticketPrompt: string, isMaint: boolean, targetDomain: string): string[] {
  const targetMatch = ticketPrompt.match(/\*\*Målfiler:\*\*\s*(.+)/);
  if (targetMatch) {
    const filesPart = targetMatch[1];
    const fileMatches = filesPart.match(/`([^`]+)`/g);
    if (fileMatches) {
      return fileMatches.map(m => m.replace(/`/g, ''));
    }
  }

  if (isMaint) {
    const scriptFiles = ticketPrompt.match(/scripts\/[a-zA-Z0-9_\-./]+\.(?:ts|js)/g) || [];
    const sharedFiles = ticketPrompt.match(/src\/shared\/[a-zA-Z0-9_\-./]+\.(?:ts|tsx)/g) || [];
    const rootFiles = ticketPrompt.match(/(?:vite\.config\.ts|package\.json|src\/App\.tsx)/g) || [];
    return Array.from(new Set([...scriptFiles, ...sharedFiles, ...rootFiles]));
  }
  const promptFiles = ticketPrompt.match(new RegExp(`src/features/${targetDomain}/[a-zA-Z0-9_/\\-]+\\.(ts|tsx)`, 'g')) || [];
  return Array.from(new Set(promptFiles)).filter(f => !f.includes('__tests__') && !f.endsWith('index.ts'));
}

export function getCompactTicketWindow(ticketsMdContent: string, recentVerifiedLimit = 5): string {
  const lines = ticketsMdContent.split('\n');
  const verifiedLines = lines.filter(l => l.includes('(VERIFIED)'));
  const recentVerified = verifiedLines.slice(-recentVerifiedLimit);
  
  let windowOutput = '# RECENTLY VERIFIED TICKETS\n';
  if (recentVerified.length === 0) {
    windowOutput += 'Inga nyligen verifierade biljetter hittades.\n';
  } else {
    windowOutput += recentVerified.join('\n') + '\n';
  }
  
  return windowOutput;
}

export function extractErrorSignature(log: string, maxLines = 15): string {
  const signatureRegex = /Error|FAIL|Transform failed|SyntaxError|TypeError|AssertionError|error TS|RADGRÄNSBROTT|✘|\[ERROR\]|❌|File:/;
  return log
    .split('\n')
    .filter(l => signatureRegex.test(l))
    .slice(0, maxLines)
    .map(l => l.trim())
    .join('\n');
}

export function validateTicketScope(ticketPrompt: string, isMaint: boolean, targetDomain: string): { valid: boolean; reason?: string } {
  const required = getRequiredFiles(ticketPrompt, isMaint, targetDomain);
  if (required.length > 4) {
    return { valid: false, reason: `För många målfiler angivna (${required.length}). Maximalt 4 målfiler tillåtna per biljett. Vänligen klyv biljetten.` };
  }
  
  const existingFiles = required.filter(f => fs.existsSync(path.resolve(process.cwd(), f)));
  if (existingFiles.length > 2) {
    return { valid: false, reason: `För många befintliga målfiler på disk (${existingFiles.length}). Maximalt 2 befintliga målfiler får ändras per biljett. Vänligen klyv biljetten.` };
  }
  
  return { valid: true };
}

export function selectRelevantRetryFiles(candidateFiles: string[], errorLog: string): string[] {
  const relevant: string[] = [];
  const lowercaseLog = errorLog.toLowerCase();
  
  for (const file of candidateFiles) {
    const filename = path.basename(file).toLowerCase();
    const basename = path.basename(file, path.extname(file));
    
    if (lowercaseLog.includes(filename) || lowercaseLog.includes(basename)) {
      relevant.push(file);
      continue;
    }
    
    if (file.includes('maintValidation') && (lowercaseLog.includes('validate') || lowercaseLog.includes('maint'))) {
      relevant.push(file);
      continue;
    }
    if (file.includes('ticketAndAnchor') && (lowercaseLog.includes('ticket') || lowercaseLog.includes('anchor'))) {
      relevant.push(file);
      continue;
    }
    if (file.includes('run-planera-live') && lowercaseLog.includes('planera')) {
      relevant.push(file);
      continue;
    }
  }
  
  return relevant.length > 0 ? relevant : candidateFiles.slice(0, 2);
}

export function extractCuratedRange(content: string, startLine: number, endLine: number): string {
  const lines = content.split('\n');
  const actualStart = Math.max(1, startLine);
  const actualEnd = Math.min(lines.length, endLine);
  
  if (actualStart > actualEnd) return '';
  
  const slicedLines = lines.slice(actualStart - 1, actualEnd);
  
  const resultLines = slicedLines.map((line, index) => {
    const actualLineNum = actualStart + index;
    return `[${actualLineNum}] ${line}`;
  });

  return `--- [TRUNKERAT RADINTERVALL ${actualStart}-${actualEnd}] ---\n${resultLines.join('\n')}\n--- [SLUT PÅ TRUNKERAT INTERVALL] ---`;
}

export function buildRetryAnchor(
  testContent: string,
  currentSourceSummary: string,
  testLog: string,
  maxChars = 24000
): string {
  let truncatedSource = currentSourceSummary;
  
  const errorLineMatch = testLog.match(/(?:scripts|src)\/[^\s:()]+:(\d+)/);
  
  if (errorLineMatch) {
    const errorLine = parseInt(errorLineMatch[1], 10);
    const lines = currentSourceSummary.split('\n');
    
    const headerLines = lines.slice(0, 40);
    const headerContent = headerLines.join('\n');
    
    const startLine = Math.max(1, errorLine - 80);
    const endLine = Math.min(lines.length, errorLine + 80);
    const rangeContent = extractCuratedRange(currentSourceSummary, startLine, endLine);
    
    truncatedSource = `${headerContent}\n\n${rangeContent}`;
  } else {
    const lines = currentSourceSummary.split('\n');
    if (lines.length > 160) {
      const startLine = lines.length - 160;
      truncatedSource = extractCuratedRange(currentSourceSummary, startLine, lines.length);
    }
  }

  const newAnchor = `TESTKOD (OFÖRÄNDERLIG LAG):\n${testContent}\n\nBEFINTLIG KÄLLKOD:\n${truncatedSource}\n\nFELLOGG:\n${testLog}`;
  
  if (newAnchor.length <= (maxChars * 0.85)) return newAnchor;

  console.warn(`⚠️ [RETRY-ANCHOR]: Storlek (${newAnchor.length}) närmar sig maxgränsen. Överväg KLYV_BILJETT.`);
  
  return newAnchor.slice(0, Math.floor(maxChars * 0.85));
}