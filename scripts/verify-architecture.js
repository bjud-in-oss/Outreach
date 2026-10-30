/**
 * scripts/verify-architecture.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Matematisk arkitekturkontroll via TypeScripts inbyggda AST:
 * 1. FSD v10.4-isolering under src/features/ (Statiska, dynamiska & alias-importer)
 * 2. Domänläckage-kontroll i scripts/
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');

console.log('🏛️  [FSD Arkitekturkontroll v10.4] Startar komplett AST-validering...');

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

if (fsdViolations > 0 || leakViolations > 0) {
  console.error(`\n💥 Arkitekturkontrollen underkändes (${fsdViolations} FSD-fel, ${leakViolations} läckage).`);
  process.exit(1);
}

console.log(`✅ Arkitektur godkänd! Samtliga ${fileCount} filer validerade mot FSD v10.4 (inkl. alias & dynamisk import).`);
