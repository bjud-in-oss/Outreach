#!/usr/bin/env node
/**
 * scripts/drivers/ts.js
 * 
 * MEKANISK AST-GRANSKARE FÖR OUTREACH COORDINATION ENGINE (v10.4)
 * 
 * Tillhandahåller deterministiska grindar:
 * - Gate 3a: `--check-alibi` (Avslöjar compliance theater & kräver körtidsankare)
 * - Gate 2c: `--check-catch-blocks` (Förbjuder tomma och tysta catch-block)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ts = require('typescript');

const ROOT_DIR = process.cwd();

// Erkända körtidsankare (Steel Thread / Skarp Liveline)
const RUNTIME_ANCHORS = [
  'getUserMedia',
  'AudioContext',
  'webkitAudioContext',
  'WebSocket',
  'userEvent',
  'fireEvent',
  'eventBus.emit',
  'emit',
  'Browserless',
  'fetch',
  'RTCPeerConnection',
];

// Otillåtna alibi-mönster i testfiler
const FORBIDDEN_ALIBI_CALLS = [
  'readFileSync',
  'readFile',
];

// ============================================================================
// HJÄLPFUNKTIONER: GIT OCH AST
// ============================================================================

function getModifiedFiles(filterPrefix = '') {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8', cwd: ROOT_DIR });
    return status
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(/\s+/).pop())
      .filter(file => file && (file.endsWith('.ts') || file.endsWith('.tsx')))
      .filter(file => (filterPrefix ? file.startsWith(filterPrefix) : true))
      .map(file => path.resolve(ROOT_DIR, file))
      .filter(fullPath => fs.existsSync(fullPath));
  } catch {
    return [];
  }
}

function parseSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

// ============================================================================
// GATE 3a: ALIBIKONTROLL (--check-alibi)
// ============================================================================

function checkAlibiInTests() {
  console.log('🔍 [Gate 3a] Skannar testfiler efter alibi-mönster och körtidsankare...');

  // Hitta ändrade eller aktiva testfiler
  let testFiles = getModifiedFiles().filter(f => f.includes('.test.') || f.includes('.spec.') || f.includes('transient'));

  // Om inga tester modifierats i git, granska alla filer under tests/ eller src/**/__tests__/
  if (testFiles.length === 0) {
    const findTests = (dir) => {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let files = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(findTests(full));
        } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts') || entry.name.includes('transient')) {
          files.push(full);
        }
      }
      return files;
    };
    testFiles = findTests(path.join(ROOT_DIR, 'tests')).concat(findTests(path.join(ROOT_DIR, 'src')));
  }

  if (testFiles.length === 0) {
    console.warn('⚠️ [Gate 3a] Inga testfiler hittades för granskning.');
    return;
  }

  let violations = [];
  let foundRuntimeAnchors = new Set();

  for (const filePath of testFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const sourceFile = parseSourceFile(filePath);

    function visit(node) {
      // 1. Spärr mot fs.readFileSync och fil-inspektion i tester
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);
        for (const forbidden of FORBIDDEN_ALIBI_CALLS) {
          if (exprText.includes(forbidden)) {
            violations.push(`${relPath}: Otillåten filinspektion upptäckt ('${exprText}'). Tester får inte läsa källkod som text.`);
          }
        }

        // Kontroll mot regex-inspektion av rå kod (.toMatch / .includes på kodsträngar)
        if (exprText.endsWith('.toMatch') || exprText.endsWith('.includes')) {
          const argText = node.arguments[0]?.getText(sourceFile) || '';
          if (argText.includes('export ') || argText.includes('function ') || argText.includes('class ')) {
            violations.push(`${relPath}: Alibi-assertion upptäckt mot rå källkodssyntax (${exprText}).`);
          }
        }
      }

      // 2. Detektering av körtidsankare (Steel Thread)
      const nodeText = node.getText(sourceFile);
      for (const anchor of RUNTIME_ANCHORS) {
        if (nodeText === anchor || nodeText.includes(`.${anchor}`)) {
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
    console.error('\n❌ GATE 3a UNDERKÄND (Skarp Liveline saknas):');
    console.error(`  Testsviten saknar erkänt körtidsankare. Minst ett av följande måste användas aktivt i körtid:`);
    console.error(`  ${RUNTIME_ANCHORS.join(', ')}`);
    process.exit(1);
  }

  console.log(`✅ [Gate 3a Godkänd] Noll alibi-mönster. Körtidsankare verifierade: ${Array.from(foundRuntimeAnchors).join(', ')}`);
}

// ============================================================================
// GATE 2c: RESILIENS & CATCH-BLOCK (--check-catch-blocks)
// ============================================================================

function checkCatchBlocks() {
  console.log('🔍 [Gate 2c] Skannar källkod efter tysta och tomma catch-block...');

  let sourceFiles = getModifiedFiles('src/features/');
  if (sourceFiles.length === 0) {
    // Om inget specifikt är stageat, skanna hela src/features/
    const findSources = (dir) => {
      if (!fs.existsSync(dir)) return [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let files = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(findSources(full));
        } else if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.includes('.test.')) {
          files.push(full);
        }
      }
      return files;
    };
    sourceFiles = findSources(path.join(ROOT_DIR, 'src', 'features'));
  }

  let violations = [];

  for (const filePath of sourceFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const sourceFile = parseSourceFile(filePath);

    function visit(node) {
      if (ts.isCatchClause(node)) {
        const block = node.block;
        const statements = block.statements;

        // Regel 1: Helt tomt catch-block
        if (statements.length === 0) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push(`${relPath}:${line + 1}: Tomt catch-block upptäckt. Fel får inte sväljas i tysthet.`);
          return;
        }

        // Regel 2: Catch-block som enbart loggar till console utan rethrow eller felpropagering
        const isOnlyConsoleLog = statements.every(stmt => {
          if (ts.isExpressionStatement(stmt) && ts.isCallExpression(stmt.expression)) {
            const callText = stmt.expression.expression.getText(sourceFile);
            return callText.startsWith('console.');
          }
          return false;
        });

        if (isOnlyConsoleLog) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push(`${relPath}:${line + 1}: Tyst catch-block upptäckt. Innehåller endast console-loggning utan felpropagering till EventBus, UI eller re-throw.`);
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  if (violations.length > 0) {
    console.error('\n❌ GATE 2c UNDERKÄND (Resiliensspärr):');
    violations.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  console.log('✅ [Gate 2c Godkänd] Alla catch-block hanterar fel transparent.');
}

// ============================================================================
// CLI-DISPATCHER
// ============================================================================

const args = process.argv.slice(2);

if (args.includes('--check-alibi')) {
  checkAlibiInTests();
} else if (args.includes('--check-catch-blocks')) {
  checkCatchBlocks();
} else {
  console.log('Användning: node scripts/drivers/ts.js [--check-alibi | --check-catch-blocks]');
  process.exit(0);
}