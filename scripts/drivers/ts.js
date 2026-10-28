#!/usr/bin/env node
/**
 * scripts/drivers/ts.js
 * 
 * MEKANISK AST-GRANSKARE FÖR OUTREACH COORDINATION ENGINE (v10.4)
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ts = require('typescript');

const ROOT_DIR = process.cwd();

const RUNTIME_ANCHORS = [
  'getUserMedia',
  'AudioContext',
  'webkitAudioContext',
  'WebSocket',
  'userEvent',
  'fireEvent',
  'eventBus.emit',
  'eventBus.subscribe',
  'SwarmEventBus.emit',
  'SwarmEventBus.subscribe',
  'emit',
  'subscribe',
  'Browserless',
  'fetch',
  'RTCPeerConnection',
];

function getModifiedFiles(filterPrefix = '') {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: ROOT_DIR });
    return status
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(/\s+/).pop())
      .filter(file => file && (file.endsWith('.ts') || file.endsWith('.tsx')))
      .filter(file => (filterPrefix ? file.startsWith(filterPrefix) : true));
  } catch (err) {
    return [];
  }
}

function parseSourceFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
}

function checkAlibiInTests(targetFile = null) {
  console.log('🔍 [Gate 3a] Skannar testfiler efter alibi-mönster och körtidsankare...');

  let testFiles = [];
  if (targetFile) {
    const resolved = path.resolve(ROOT_DIR, targetFile);
    if (fs.existsSync(resolved)) testFiles = [resolved];
  }
  if (testFiles.length === 0) {
    testFiles = getModifiedFiles().filter(f => f.includes('.test.') || f.includes('.spec.') || f.includes('transient'));
  }

  let violations = [];
  let foundRuntimeAnchors = new Set();

  for (const filePath of testFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const sourceFile = parseSourceFile(filePath);

    function visit(node) {
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);

        // 1. Spärr mot syntetiska spioner och mockar
        if (exprText.includes('spyOn') || exprText.includes('vi.fn') || exprText.includes('jest.fn')) {
          violations.push(`${relPath}: Alibi-spion upptäckt (${exprText}). Körtidsankare måste verifieras via faktiska händelser mot bussen, inte mockas.`);
        }

        // 2. Spärr mot textmatchning av rå syntax
        if (exprText.endsWith('.toContain') || exprText.endsWith('.toMatch') || exprText.endsWith('.includes')) {
          const argText = node.arguments[0]?.getText(sourceFile) || '';
          if (argText.includes('export ') || argText.includes('function ') || argText.includes('class ')) {
            violations.push(`${relPath}: Alibi-assertion mot källkodssyntax (${exprText}). Testa funktionens körtidsbeteende.`);
          }
        }
      }

      // Detektering av körtidsankare
      const nodeText = node.getText(sourceFile);
      for (const anchor of RUNTIME_ANCHORS) {
        if (nodeText === anchor || nodeText.includes(`.${anchor}`) || nodeText.includes(anchor)) {
          foundRuntimeAnchors.add(anchor);
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  if (violations.length > 0) {
    console.error('\n❌ GATE 3a UNDERKÄND (Alibispärr aktiverad):');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  if (foundRuntimeAnchors.size === 0) {
    console.error('\n❌ GATE 3a UNDERKÄND (Körtidsankare saknas):');
    console.error(`  Kräver aktivt körtidsankare ur: ${RUNTIME_ANCHORS.join(', ')}`);
    process.exit(1);
  }

  console.log(`✅ [Gate 3a Godkänd] Noll alibi-mönster. Körtidsankare verifierade: ${Array.from(foundRuntimeAnchors).join(', ')}`);
}

function checkCatchBlocks() {
  console.log('🔍 [Gate 2c] Skannar källkod efter tysta och tomma catch-block...');
  const files = getModifiedFiles('src/');
  let violations = [];

  for (const filePath of files) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const sourceFile = parseSourceFile(filePath);

    function visit(node) {
      if (ts.isCatchClause(node)) {
        const catchBody = node.block.statements;
        if (catchBody.length === 0) {
          violations.push(`${relPath}: Tomt catch-block upptäckt.`);
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  if (violations.length > 0) {
    console.error('\n❌ GATE 2c UNDERKÄND (Tysta catch-block upptäckta):');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }
  console.log('✅ [Gate 2c Godkänd] Alla catch-block hanterar fel transparent.');
}

const isRunningDirectly = process.argv[1] && process.argv[1].endsWith('ts.js');
const args = process.argv.slice(2);

if (isRunningDirectly) {
  if (args.includes('--check-alibi')) {
    const fileArgIdx = args.indexOf('--file');
    const targetFile = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;
    checkAlibiInTests(targetFile);
  } else if (args.includes('--check-catch-blocks')) {
    checkCatchBlocks();
  } else {
    console.error('❌ Okända eller saknade flaggor till ts.js');
    process.exit(1);
  }
}
