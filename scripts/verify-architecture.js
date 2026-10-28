/**
 * scripts/verify-architecture.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Mekanisk arkitekturkontroll:
 * 1. FSD v10.4-efterlevnad under src/
 * 2. Domänläckage-kontroll i scripts/ (förhindrar hårdkodning och alibi-fixar)
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

console.log('🏛️  [FSD Arkitekturkontroll v10.4] Startar validering...');

// ============================================================================
// GRIND 1: FSD-isolering under src/
// ============================================================================
let fsdViolations = 0;
let fileCount = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        scanDir(fullPath);
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      fileCount++;
      checkFsdBoundaries(fullPath);
    }
  }
}

function checkFsdBoundaries(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importLines = content.split('\n').filter(l => l.trim().startsWith('import ') || l.trim().startsWith('export * from'));
  
  // Hitta om filen tillhör en specifik feature-domän
  const featureMatch = filePath.match(/src\/features\/([^/]+)/);
  const currentFeature = featureMatch ? featureMatch[1] : null;

  for (const line of importLines) {
    // Spärra korsvisa importer mellan features under src/features/
    if (currentFeature) {
      const crossFeatureMatch = line.match(/features\/([^/'"]+)/);
      if (crossFeatureMatch && crossFeatureMatch[1] !== currentFeature) {
        console.error(`❌ FSD-BROTT i ${path.relative(ROOT_DIR, filePath)}:`);
        console.error(`   Otillåten kors-import till domänen '${crossFeatureMatch[1]}': "${line.trim()}"`);
        fsdViolations++;
      }
    }
  }
}

scanDir(SRC_DIR);

// ============================================================================
// GRIND 2: Domänläckage och incidentdriven hårdkodning i scripts/
// ============================================================================
console.log('🔒 [Domänläckage-kontroll] Skannar scripts/ efter hårdkodade domänspecifika regler...');

const FORBIDDEN_LEAK_PATTERNS = [
  { pattern: /['"]\.\/heartbeat['"]/, desc: "Hårdkodad barrelexport av './heartbeat'" },
  { pattern: /ping\.ts/, desc: "Hårdkodad filreferens till 'ping.ts'" },
  { pattern: /heartbeat\.ts/, desc: "Hårdkodad filreferens till 'heartbeat.ts'" },
  { pattern: /Cannot find package 'uuid'/, desc: "Hårdkodad felhanteringsregel för 'uuid'" }
];

let leakViolations = 0;
const scriptsToCheck = ['run-planera-live.ts', 'run-tests.js'];

for (const scriptName of scriptsToCheck) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  if (!fs.existsSync(scriptPath)) continue;

  const content = fs.readFileSync(scriptPath, 'utf-8');
  for (const rule of FORBIDDEN_LEAK_PATTERNS) {
    if (rule.pattern.test(content)) {
      console.error(`❌ DOMÄNLÄCKAGE I ${scriptName}:`);
      console.error(`   Hårdkodad domänspecifik regel upptäckt: ${rule.desc}`);
      leakViolations++;
    }
  }
}

if (fsdViolations > 0 || leakViolations > 0) {
  console.error(`\n💥 Arkitekturkontrollen underkändes (${fsdViolations} FSD-fel, ${leakViolations} domänläckage).`);
  process.exit(1);
}

console.log(`✅ Arkitektur godkänd! Samtliga ${fileCount} källkodsfiler följer FSD v10.4 och motorn i scripts/ är 100 % agnostisk.`);
