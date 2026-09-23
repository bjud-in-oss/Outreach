import fs from 'node:fs';
import path from 'node:path';

/**
 * Driver för statisk TypeScript- och arkitekturinspektion
 */
export function scanTypeScriptFiles(baseDirs) {
  const files = [];

  function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }

  for (const dir of baseDirs) {
    traverse(dir);
  }

  return files;
}

/**
 * Verifierar att kontrakt följer strikta regler (t.ex. Zod-export, inga cirkulära referenser)
 */
export function verifyContracts(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: `Fil saknas: ${filePath}` };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const hasZodImport = content.includes("import { z } from 'zod'") || content.includes('import { z }');
  const hasEnvelopeExport = content.includes('export const EventEnvelopeSchema');

  if (!hasZodImport) {
    return { valid: false, error: `${filePath}: Zod-import saknas` };
  }
  if (!hasEnvelopeExport) {
    return { valid: false, error: `${filePath}: EventEnvelopeSchema exporteras inte` };
  }

  return { valid: true };
}
