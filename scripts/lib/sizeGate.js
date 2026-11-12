import fs from 'fs';
import path from 'path';

const LEGACY_SCRIPT_CAPS = { 'run-planera-live.ts': 1000, 'bidiLiveRunner.ts': 345 };
const LEGACY_FEATURE_CAPS = { 'geminiLiveSession.ts': 260, 'sessionIntentAudio.ts': 300 };

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function validateDirectory(dir, limit, legacyCaps, extFilter = []) {
  let violations = 0;
  
  if (!fs.existsSync(dir)) return violations;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file === '__tests__' || file === 'node_modules') continue;
      violations += validateDirectory(fullPath, limit, legacyCaps, extFilter);
    } else if (stat.isFile()) {
      if (file.includes('.legacy.')) continue;
      if (extFilter.length > 0 && !extFilter.some(ext => file.endsWith(ext))) continue;

      const lines = countLines(fullPath);
      const cap = legacyCaps[file] || limit;

      if (lines > cap) {
        console.log(`❌ RADGRÄNSBROTT i ${fullPath}: ${lines} rader (max ${cap})`);
        violations++;
      }
    }
  }

  return violations;
}

export function validateCodebaseLineLimits(rootDir) {
  let violations = 0;
  
  console.log('🔍 Kontrollerar radgränser...');

  // Validera scripts/
  const scriptsDir = path.join(rootDir, 'scripts');
  violations += validateDirectory(scriptsDir, 250, LEGACY_SCRIPT_CAPS, ['.js', '.ts']);

  // Validera src/features/
  const featuresDir = path.join(rootDir, 'src', 'features');
  violations += validateDirectory(featuresDir, 125, LEGACY_FEATURE_CAPS, ['.tsx']);
  violations += validateDirectory(featuresDir, 250, LEGACY_FEATURE_CAPS, ['.ts']);

  console.log(`Radgränskontroll klar. Hitta ${violations} brott.`);
  return violations;
}
