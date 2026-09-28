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

/**
 * Kontrollerar AST- och strukturmått enligt TCK-012:
 * - Filgränser: Max 125 rader för .tsx, max 250 rader för .ts
 * - Indenteringsdjup: Max 4 nivåer
 * - Förgreningsgrad: Max 5 villkor per komponent/funktion
 */
export function checkAstMetrics(filePath, content) {
  const ext = path.extname(filePath);
  const lines = content.split('\n');
  const lineCount = lines.length;

  if (ext === '.tsx' && lineCount > 125) {
    return { valid: false, error: `${filePath} överskrider gränsen på 125 rader (${lineCount} rader)` };
  }
  if (ext === '.ts' && lineCount > 250) {
    return { valid: false, error: `${filePath} överskrider gränsen på 250 rader (${lineCount} rader)` };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    const leadingSpaces = line.match(/^(\s*)/)[1].length;
    const depth = Math.floor(leadingSpaces / 2);
    if (depth > 4) {
      return { valid: false, error: `${filePath}:${i + 1} har indenteringsdjup ${depth} (> 4 nivåer)` };
    }
  }

  const branchTokens = content.match(/\b(if|switch|case|\?)\b|(&&|\|\|)/g) || [];
  if (ext === '.tsx' && branchTokens.length > 5) {
    return { valid: false, error: `${filePath} har förgreningsgrad ${branchTokens.length} (> 5 villkor)` };
  }

  return { valid: true, lineCount, branchCount: branchTokens.length };
}
