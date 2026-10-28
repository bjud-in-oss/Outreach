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

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

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

function checkAlibiInTests(targetFile = null) {
  console.log('🔍 [Gate 3a] Skannar testfiler efter alibi-mönster och körtidsankare...');

  let testFiles = [];

  if (targetFile) {
    const resolved = path.resolve(ROOT_DIR, targetFile);
    if (fs.existsSync(resolved)) {
      testFiles = [resolved];
    }
  }

  if (testFiles.length === 0) {
    testFiles = getModifiedFiles().filter(f => f.includes('.test.') || f.includes('.spec.') || f.includes('transient'));
  }

  // Om inga tester modifierats i git och ingen målfil angivits, granska transient-tester i src/
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
    testFiles = findTests(path.join(ROOT_DIR, 'src', '__tests__'));
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
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);

        // 1. Spärr mot textmatchning av rå syntax (alibi assertions)
        if (exprText.endsWith('.toContain') || exprText.endsWith('.toMatch') || exprText.endsWith('.includes')) {
          const argText = node.arguments[0]?.getText(sourceFile) || '';
          if (
            argText.includes('export ') || 
            argText.includes('function ') || 
            argText.includes('class ') ||
            argText.includes('interface ')
          ) {
            violations.push(`${relPath}: Alibi-assertion upptäckt mot rå källkodssyntax (${exprText}). Källkod måste testas via körtid, inte textinnehåll.`);
          }
        }

        // 2. Granska readFileSync: Tillåtet för mätning (checkAstMetrics), förbjudet för funktionstest
        if (exprText.includes('readFileSync') || exprText.includes('readFile')) {
          let parent = node.parent;
          let isMetricCall = false;

          while (parent && !ts.isBlock(parent) && !ts.isSourceFile(parent)) {
            if (ts.isCallExpression(parent)) {
              const pText = parent.expression.getText(sourceFile);
              if (pText.includes('checkAstMetrics') || pText.includes('checkNoProductionMocks')) {
                isMetricCall = true;
                break;
              }
            }
            parent = parent.parent;
          }

          // Undersök vad som läses
          const firstArg = node.arguments[0]?.getText(sourceFile) || '';
          const targetsSrc = firstArg.includes('src/') || firstArg.includes('.ts');

          if (!isMetricCall && targetsSrc) {
            // Kontrollera om resultatet skickas till en assertion
            let current = node.parent;
            let usedInAssertion = false;
            while (current && !ts.isBlock(current) && !ts.isSourceFile(current)) {
              if (ts.isCallExpression(current)) {
                const callName = current.expression.getText(sourceFile);
                if (callName.includes('expect') || callName.includes('assert')) {
                  usedInAssertion = true;
                  break;
                }
              }
              current = current.parent;
            }

            if (usedInAssertion) {
              violations.push(`${relPath}: Otillåten filinspektion ('${exprText}'). Källkodsfiler får inte läsas som text i funktionella tester.`);
            }
          }
        }
      }

      // 3. Detektering av körtidsankare (Steel Thread)
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

  const featIdx = process.argv.indexOf('--feature');
  const targetDomain = featIdx !== -1 ? process.argv[featIdx + 1] : '';
  const searchRoot = targetDomain ? 'src/features/' + targetDomain + '/' : 'src/features/';
  let sourceFiles = getModifiedFiles(searchRoot);
  if (sourceFiles.length === 0) {
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
    sourceFiles = findSources(path.join(ROOT_DIR, searchRoot));
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
// HJÄLPFUNKTIONER FÖR TESTER (Bibehåller 100% bakåtkompatibilitet)
// ============================================================================

export function checkAstMetrics(filePath, content) {
  const lineCount = content.split('\n').length;
  const isTsx = filePath.endsWith('.tsx');
  const maxLines = isTsx ? 120 : 250;
  if (lineCount > maxLines) {
    return {
      valid: false,
      error: `Överträdelse av radgräns (${lineCount} rader, max är ${maxLines} för ${isTsx ? '.tsx' : '.ts'})`,
    };
  }
  return { valid: true };
}

export function checkNoProductionMocks(filePath, content) {
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    return { valid: true };
  }
  if (content.includes('isTestMode')) {
    return { valid: false, error: 'isTestMode är otillåtet i produktionskod' };
  }
  if (content.includes('generateDeterministicFallback')) {
    return { valid: false, error: 'generateDeterministicFallback är otillåtet i produktionskod' };
  }
  if (content.includes('mock-folder')) {
    return { valid: false, error: 'mock-folder är otillåtet i produktionskod' };
  }
  if (content.includes('vi.mock(') || content.includes('jest.mock(')) {
    return { valid: false, error: 'Produktionsmockar är otillåtna' };
  }
  return { valid: true };
}

export { checkAlibiInTests, checkCatchBlocks };

// ============================================================================
// CLI-DISPATCHER
// ============================================================================

const isRunningDirectly = process.argv[1] && process.argv[1].endsWith('ts.js');
const args = process.argv.slice(2);

if (isRunningDirectly) {
  if (args.includes('--check-alibi')) {
    const fileArgIdx = args.indexOf('--file');
    const targetFile = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;
    checkAlibiInTests(targetFile);
  } else if (args.includes('--check-catch-blocks')) {
    checkCatchBlocks();
  } else if (args.length > 0) {
    console.log('Användning: node scripts/drivers/ts.js [--check-alibi [--file path] | --check-catch-blocks]');
    process.exit(0);
  }
}