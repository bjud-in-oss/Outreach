import * as fs from 'fs';
import * as path from 'path';

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

export function buildRetryAnchor(
  testContent: string,
  currentSourceSummary: string,
  testLog: string,
  maxChars = 24000
): string {
  const baseAnchor = `TESTKOD (OFÖRÄNDERLIG LAG):\n${testContent}\n\nBEFINTLIG KÄLLKOD:\n${currentSourceSummary}\n\nFELLOGG:\n${testLog}`;
  
  if (baseAnchor.length <= maxChars) {
    return baseAnchor;
  }

  const overflow = baseAnchor.length - maxChars;
  console.warn(`⚠️ [RETRY-ANCHOR TRUNKERING]: Storlek (${baseAnchor.length}) överstiger ${maxChars} tecken. Trunkerar källkodssammanfattningen med ${overflow} tecken.`);

  // Vi trunkerar currentSourceSummary för att hålla oss inom gränsen
  const currentSourceChars = currentSourceSummary.length;
  // Om källkods-sammanfattningen inte räcker för att täcka overflow (väldigt osannolikt), tar vi bort allt från den.
  const charsToRemoveFromSource = Math.min(currentSourceChars, overflow + 500); // lite marginal
  
  const truncatedSource = currentSourceSummary.slice(0, Math.max(0, currentSourceChars - charsToRemoveFromSource)) + 
    "\n... [TRUNKERAD PGA TILLÅTEN MAXLÄNGD FÖR KONTEXT] ...";

  const newAnchor = `TESTKOD (OFÖRÄNDERLIG LAG):\n${testContent}\n\nBEFINTLIG KÄLLKOD:\n${truncatedSource}\n\nFELLOGG:\n${testLog}`;
  
  return newAnchor;
}
