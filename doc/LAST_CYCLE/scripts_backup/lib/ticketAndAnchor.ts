import * as fs from 'fs';
import * as path from 'path';

export interface SourceManifestEntry {
  path: string;
  lineCount: number;
  charCount: number;
  content: string;
}

export interface BatchPlan {
  pass1: SourceManifestEntry[];
  pass2: SourceManifestEntry[];
  truncatedFiles: string[];
}

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

export function buildSourceManifest(files: string[]): SourceManifestEntry[] {
  return files.map(file => {
    const fullPath = path.resolve(process.cwd(), file);
    let content = '';
    try {
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath, 'utf-8');
      }
    } catch (e) {
      console.warn(`⚠️ Kunde inte läsa fil ${file}:`, e);
    }
    const lines = content.split('\n');
    return {
      path: file,
      lineCount: lines.length,
      charCount: content.length,
      content
    };
  });
}

export function extractCuratedRange(content: string, startLine: number, endLine: number): string {
  const lines = content.split('\n');
  const slicedLines = lines.slice(startLine - 1, endLine);
  
  const resultLines = slicedLines.map((line, index) => {
    const actualLineNum = startLine + index;
    return `[${actualLineNum}] ${line}`;
  });

  return `--- [TRUNKERAT RADINTERVALL ${startLine}-${endLine}] ---\n${resultLines.join('\n')}\n--- [SLUT PÅ TRUNKERAT INTERVALL] ---`;
}

export function planContextBatches(
  files: string[], 
  errorLog: string, 
  maxChars = 24000,
  prioritizeFn?: (manifest: SourceManifestEntry[], errorLog: string) => { pass1: string[], pass2: string[] }
): BatchPlan {
  const manifest = buildSourceManifest(files);
  const totalChars = manifest.reduce((sum, entry) => sum + entry.charCount, 0);
  
  if (totalChars <= maxChars) {
    return {
      pass1: manifest,
      pass2: [],
      truncatedFiles: []
    };
  }

  // Överstiger maxChars, behöver dela upp
  let pass1Paths: string[] = [];
  let pass2Paths: string[] = [];
  const truncatedFiles: string[] = [];

  if (prioritizeFn) {
    const priority = prioritizeFn(manifest, errorLog);
    pass1Paths = priority.pass1;
    pass2Paths = priority.pass2;
  } else {
    // Deterministisk fallback
    pass1Paths = manifest.slice(0, Math.ceil(manifest.length / 2)).map(e => e.path);
    pass2Paths = manifest.slice(Math.ceil(manifest.length / 2)).map(e => e.path);
  }

  const pass1 = manifest.filter(e => pass1Paths.includes(e.path));
  const pass2 = manifest.filter(e => pass2Paths.includes(e.path));

  // Trunkera filer som spränger budgeten ensamma (eller om batch är för stor)
  // Enkel implementering: Om vi måste dela upp, kör vi full text om rimligt, annars trunkerar vi
  // För detta kontrakt vill vi tillämpa curatedRanges endast på filer som spränger budgeten
  
  return {
    pass1,
    pass2,
    truncatedFiles
  };
}

export function buildCrashDumpPayload(data: any, maxChars = 24000): any {
  const payload = {
    previousTestCode: data.previousTestCode || '',
    crashDiff: data.crashDiff || '',
    errorSignature: data.errorSignature || '',
    omvandelseCount: data.omvandelseCount || 0,
    priorityPlan: data.priorityPlan || null,
    timestamp: new Date().toISOString()
  };

  const jsonString = JSON.stringify(payload);
  
  if (jsonString.length <= maxChars) {
    return payload;
  }

  console.warn(`⚠️ [CRASH-DUMP TRUNKERING]: Storlek (${jsonString.length}) överstiger ${maxChars} tecken.`);
  
  // Trunkera previousTestCode om payload är för stor
  if (payload.previousTestCode.length > 1000) {
    payload.previousTestCode = payload.previousTestCode.slice(0, 1000) + "\n... [TRUNKERAD] ...";
  }
  
  return payload;
}

export function buildRetryAnchor(
  testContent: string,
  currentSourceSummary: string,
  testLog: string,
  maxChars = 24000
): string {
  let truncatedSource = currentSourceSummary;
  const lineMatch = testLog.match(/:(\d+):(\d+)/) || testLog.match(/line (\d+)/i);
  
  if (lineMatch) {
    const errorLine = parseInt(lineMatch[1], 10);
    const lines = currentSourceSummary.split('\n');
    const startLine = Math.max(1, errorLine - 80);
    const endLine = Math.min(lines.length, errorLine + 80);
    truncatedSource = extractCuratedRange(currentSourceSummary, startLine, endLine);
  } else {
    const lines = currentSourceSummary.split('\n');
    if (lines.length > 160) {
      const startLine = lines.length - 160;
      truncatedSource = extractCuratedRange(currentSourceSummary, startLine, lines.length);
    }
  }

  const newAnchor = `TESTKOD (OFÖRÄNDERLIG LAG):\n${testContent}\n\nBEFINTLIG KÄLLKOD:\n${truncatedSource}\n\nFELLOGG:\n${testLog}`;
  if (newAnchor.length <= maxChars) return newAnchor;

  console.warn(`⚠️ [RETRY-ANCHOR TRUNKERING]: Storlek (${newAnchor.length}) överstiger ${maxChars} tecken.`);
  
  const suffix = "\n... [TRUNKERAD PGA TILLÅTEN MAXLÄNGD FÖR KONTEXT] ...";
  const allowLength = maxChars - suffix.length;
  
  if (allowLength < 100) {
    return newAnchor.slice(0, maxChars > suffix.length ? maxChars - suffix.length : 0) + suffix;
  }
  
  return newAnchor.slice(0, allowLength) + suffix;
}
