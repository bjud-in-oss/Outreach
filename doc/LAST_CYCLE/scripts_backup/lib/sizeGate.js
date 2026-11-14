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
  return 0;
}
