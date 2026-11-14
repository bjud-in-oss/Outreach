import fs from 'fs';
import path from 'path';

const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1000, 'bidiLiveRunner.ts': 345 };
const LEGACY_FEATURE_CAPS = { 'geminiLiveSession.ts': 260, 'sessionIntentAudio.ts': 300 };

export function countLines(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

export function getLineLimitForFile(relPath) {
  const fileName = path.basename(relPath);
  
  if (relPath.startsWith('scripts/')) {
    return LEGACY_SCRIPT_CAPS[fileName] || 250;
  }
  
  if (relPath.startsWith('src/features/')) {
    if (fileName.endsWith('.tsx')) {
      return LEGACY_FEATURE_CAPS[fileName] || 125;
    }
    if (fileName.endsWith('.ts')) {
      return LEGACY_FEATURE_CAPS[fileName] || 250;
    }
  }
  
  return 250;
}

export function getNearLimitWarnings(rootDir, targetFiles) {
  const warnings = [];

  for (const relPath of targetFiles) {
    const fullPath = path.join(rootDir, relPath);
    const lineCount = countLines(fullPath);
    const limit = getLineLimitForFile(relPath);

    let threshold = limit * 0.72; // Warn at > 180/250 (~72%), > 90/125 (72%)

    if (relPath.endsWith('.tsx')) {
       threshold = 90; 
    } else if (limit === 250) {
       threshold = 180;
    }

    if (lineCount > threshold) {
      warnings.push(`⚠️ Varning: ${relPath} närmar sig gränsen (${lineCount} / ${limit} rader)`);
    }
  }

  return warnings;
}

export function validateCodebaseLineLimits(rootDir) {
  let violations = 0;
  const srcDir = path.join(rootDir, 'src');
  
  if (!fs.existsSync(srcDir)) return 0;

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          scanDir(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const relPath = path.relative(rootDir, fullPath);
        const lineCount = countLines(fullPath);
        const limit = getLineLimitForFile(relPath);
        if (lineCount > limit) {
          console.error(`❌ Radgräns överskriden i ${relPath}: ${lineCount} / ${limit} rader`);
          violations++;
        }
      }
    }
  }

  scanDir(srcDir);
  return violations;
}
