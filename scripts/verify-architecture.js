/**
 * scripts/verify-architecture.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.5)
 * Matematisk arkitekturkontroll via TypeScripts inbyggda AST:
 * 1. FSD v10.5-isolering under src/features/ (Statiska, dynamiska & alias-importer)
 * 2. Domänläckage-kontroll i scripts/
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

console.log('🏛️  [FSD Arkitekturkontroll v10.5] Startar komplett AST-validering...');

let fsdViolations = 0;
let fileCount = 0;

function checkFsdImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  
  const featureMatch = filePath.match(/src\/features\/([^/]+)/);
  const currentFeature = featureMatch ? featureMatch[1] : null;

  function inspectImportString(importPath, node) {
    if (!currentFeature) return;

    let targetFeature = null;

    if (importPath.startsWith('@/features/')) {
      const match = importPath.match(/@\/features\/([^/'"]+)/);
      if (match) targetFeature = match[1];
    } else if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), importPath);
      const relToSrc = path.relative(path.join(ROOT_DIR, 'src'), resolved);
      const parts = relToSrc.split(path.sep);
      if (parts[0] === 'features' && parts.length > 1) {
        targetFeature = parts[1];
      }
    }

    if (targetFeature && targetFeature !== currentFeature && targetFeature !== 'shared') {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
      console.error(`❌ FSD-BROTT i ${path.relative(ROOT_DIR, filePath)}:${line + 1}:`);
      console.error(`   Otillåten kors-import från domänen '${currentFeature}' till '${targetFeature}' ("${importPath}")`);
      fsdViolations++;
    }
  }

  function visit(node) {
    // Statiska importer och re-exporter
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        inspectImportString(node.moduleSpecifier.text, node);
      }
    }
    // Dynamiska importer: import('...')
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        inspectImportString(arg.text, node);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
}

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        scanDir(full);
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      fileCount++;
      checkFsdImports(full);
    }
  }
}

scanDir(SRC_DIR);

// ============================================================================
// GRIND 2: DOMÄNLÄCKAGE I SCRIPTS/ (AST-verifierad)
// ============================================================================
console.log('🔒 [Domänläckage-kontroll] Skannar scripts/ efter hårdkodade regler via AST...');

let leakViolations = 0;
const FORBIDDEN_LEAK_DOMAINS = ['telemetry', 'gemini_live_swarm', 'google_drive_sync', 'mcp_bridge', 'wal_logger'];
const scriptsToCheck = ['run-planera-live.ts', 'run-tests.js'];

for (const scriptName of scriptsToCheck) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  if (!fs.existsSync(scriptPath)) continue;

  const content = fs.readFileSync(scriptPath, 'utf-8');
  const sf = ts.createSourceFile(scriptPath, content, ts.ScriptTarget.Latest, true);

  function checkScriptNode(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const imp = node.moduleSpecifier.text;
      for (const dom of FORBIDDEN_LEAK_DOMAINS) {
        if (imp.includes(`features/${dom}`)) {
          console.error(`❌ DOMÄNLÄCKAGE I ${scriptName}: Direkt import av domän '${dom}' ("${imp}")`);
          leakViolations++;
        }
      }
    }
    ts.forEachChild(node, checkScriptNode);
  }

  checkScriptNode(sf);
}


// ============================================================================
// GRIND 3: SI-VERSIONSKONTROLL OCH LÄNKGILTIGHET
// ============================================================================
console.log('🔗 [SI-Versionskontroll] Skannar dokumentation och skript efter gamla SI-länkar...');

let siLinkViolations = 0;
const docDir = path.join(ROOT_DIR, 'doc');
const docFiles = fs.readdirSync(docDir).filter(f => f.startsWith('SI_v') && f.endsWith('.md'));

if (docFiles.length > 0) {
  // Hitta den nyaste SI-versionen på disk
  const latestSiFile = docFiles.sort((a, b) => {
    const vA = parseFloat(a.replace('SI_v', '').replace('.md', ''));
    const vB = parseFloat(b.replace('SI_v', '').replace('.md', ''));
    return vB - vA;
  })[0];
  
  const latestVersionStr = latestSiFile.replace('.md', ''); // T.ex. 'SI_v10.5'

  // Hitta alla gamla versioner som ligger på disk för att kunna varna
  const outdatedSiFiles = docFiles.filter(f => f !== latestSiFile).map(f => f.replace('.md', ''));

  // Bygg en regex för att hitta omnämnanden av SI_vX.X i koden/dokumentationen
  const siRegex = /SI_v\d+\.\d+/g;

  function checkSiReferences(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') checkSiReferences(full);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name === 'package.json') {
        const content = fs.readFileSync(full, 'utf-8');
        let match;
        while ((match = siRegex.exec(content)) !== null) {
          const foundVersion = match[0]; // T.ex. SI_v10.5
          if (foundVersion !== latestVersionStr) {
            console.warn(`⚠️ FÖRÅLDRAD SI-REFERENS i ${path.relative(ROOT_DIR, full)}:`);
            console.warn(`   Filen refererar till '${foundVersion}' men repots aktuella standard är '${latestVersionStr}'.`);
            siLinkViolations++;
          }
        }
      }
    }
  }

  // Skanna igenom viktiga mappar efter brutna SI-länkar
  checkSiReferences(path.join(ROOT_DIR, 'doc'));
  checkSiReferences(path.join(ROOT_DIR, 'scripts'));
  checkSiReferences(path.join(ROOT_DIR, '.agents'));
}

if (fsdViolations > 0 || leakViolations > 0 || siLinkViolations > 0) {
  console.error(`\n💥 Arkitekturkontrollen underkändes (${fsdViolations} FSD-fel, ${leakViolations} läckage, ${siLinkViolations} SI-länkningsfel).`);
  process.exit(1);
}

console.log(`✅ Arkitektur godkänd! Samtliga ${fileCount} filer validerade mot FSD v10.5 (inkl. alias & dynamisk import).`);
