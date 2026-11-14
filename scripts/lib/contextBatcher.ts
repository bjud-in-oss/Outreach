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

  let pass1Paths: string[] = [];
  let pass2Paths: string[] = [];
  const truncatedFiles: string[] = [];

  if (prioritizeFn) {
    const priority = prioritizeFn(manifest, errorLog);
    pass1Paths = priority.pass1;
    pass2Paths = priority.pass2;
  } else {
    pass1Paths = manifest.slice(0, Math.ceil(manifest.length / 2)).map(e => e.path);
    pass2Paths = manifest.slice(Math.ceil(manifest.length / 2)).map(e => e.path);
  }

  const pass1 = manifest.filter(e => pass1Paths.includes(e.path));
  const pass2 = manifest.filter(e => pass2Paths.includes(e.path));

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
  
  if (payload.previousTestCode.length > 1000) {
    payload.previousTestCode = payload.previousTestCode.slice(0, 1000) + "\n... [TRUNKERAD] ...";
  }
  
  return payload;
}
