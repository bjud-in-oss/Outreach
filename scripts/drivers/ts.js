/**
 * scripts/drivers/ts.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Fullständig intern AST-grind via TypeScript Compiler API.
 * Täcker kontroll 2, 3, 4, 5, 6 och 7 i matrisen utan externa beroenden.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const args = process.argv.slice(2);

// ============================================================================
// GATE 2c: AST-KONTROLL MOT TYSTA CATCH-BLOCK (Kontroll 6 & 7)
// ============================================================================
if (args.includes('--check-catch-blocks')) {
  console.log('🔒 [Gate 2c AST] Skannar källkod efter tysta catch-block och produktionsmockar...');
  const srcDir = path.join(ROOT_DIR, 'src');
  let catchViolations = 0;
  let mockViolations = 0;

  function checkProdNode(node, filePath, sourceFile) {
    // Kontroll 6: Tysta catch-block
    if (ts.isCatchClause(node)) {
      const block = node.block;
      if (!block || block.statements.length === 0) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        console.error(`❌ GATE 2c BROTT: Tomt catch-block i ${path.relative(ROOT_DIR, filePath)}:${line + 1}`);
        catchViolations++;
      }
    }

    // Kontroll 7: Otillåtna testflaggor / mock-hjälpare i produktionskod (ej i __tests__)
    if (!filePath.includes('__tests__') && !filePath.includes('.legacy.')) {
      if (ts.isIdentifier(node)) {
        if (node.text === 'isTestMode' || node.text === 'generateDeterministicFallback') {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          console.error(`❌ KONTROLL 7 BROTT: Otillåten testflagga '${node.text}' i produktionskod: ${path.relative(ROOT_DIR, filePath)}:${line + 1}`);
          mockViolations++;
        }
      }
    }

    ts.forEachChild(node, n => checkProdNode(n, filePath, sourceFile));
  }

  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') scan(full);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf-8');
        const sf = ts.createSourceFile(full, content, ts.ScriptTarget.Latest, true);
        checkProdNode(sf, full, sf);
      }
    }
  }

  scan(srcDir);
  if (catchViolations > 0 || mockViolations > 0) {
    console.error(`\n💥 Gate 2c underkändes: ${catchViolations} tysta catch, ${mockViolations} testmockar i prod.`);
    process.exit(1);
  }
  console.log('✅ Gate 2c godkänd: Alla catch-block propagerar fel och produktionskoden är ren från mockar.');
  process.exit(0);
}

// ============================================================================
// GATE 3a: ALIBI-SPÄRR (Kontroll 2, 3, 4, 5)
// ============================================================================
if (args.includes('--check-alibi')) {
  const fileIndex = args.indexOf('--file');
  const targetFile = fileIndex !== -1 ? args[fileIndex + 1] : null;

  if (!targetFile || !fs.existsSync(path.resolve(ROOT_DIR, targetFile))) {
    console.error(`❌ Ingen giltig testfil angiven för --check-alibi: ${targetFile}`);
    process.exit(1);
  }

  console.log(`🔒 [Gate 3a AST] Granskar testfil mot alibi-mönster: ${targetFile}`);
  const fullPath = path.resolve(ROOT_DIR, targetFile);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const sf = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true);

  let hasSpies = false;
  let hasRuntimeAnchor = false;
  let hasSourceTextAssertion = false;
  let hasIllegalFsRead = false;

  const RUNTIME_ANCHORS = [
    'emit', 'addEventListener', 'dispatchEvent', 'fetch', 'WebSocket',
    'AudioContext', 'EventBus', 'swarmEventBus', 'crypto'
  ];

  const FORBIDDEN_TEXT_ASSERTIONS = ['export function', 'export const', 'export interface', 'import '];

  function inspectTestNode(node) {
    // Kontroll 2: Alibi-spioner
    if (ts.isCallExpression(node)) {
      const text = node.expression.getText(sf);
      if (text.includes('vi.fn') || text.includes('vi.spyOn') || text.includes('jest.fn')) {
        hasSpies = true;
      }

      // Kontroll 4: Otillåten filinspektion inuti testet (fs.readFileSync mot källkod)
      if (text.includes('readFileSync') || text.includes('fs.read')) {
        hasIllegalFsRead = true;
      }

      // Kontroll 3: Assertions mot rå källkodstext i stället för funktionell exekvering
      if (text.includes('toContain') || text.includes('toMatch')) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg) && FORBIDDEN_TEXT_ASSERTIONS.some(kw => arg.text.includes(kw))) {
            hasSourceTextAssertion = true;
          }
        }
      }

      for (const anchor of RUNTIME_ANCHORS) {
        if (text.includes(anchor)) hasRuntimeAnchor = true;
      }
    } else if (ts.isIdentifier(node)) {
      if (RUNTIME_ANCHORS.includes(node.text)) {
        hasRuntimeAnchor = true;
      }
    }
    ts.forEachChild(node, inspectTestNode);
  }

  inspectTestNode(sf);

  if (hasIllegalFsRead) {
    console.error(`❌ GATE 3a BROTT i ${targetFile}:`);
    console.error(`   Testet anropar fs.readFileSync! Tester ska testa funktionellt i minnet, inte läsa filer.`);
    process.exit(1);
  }

  if (hasSourceTextAssertion) {
    console.error(`❌ GATE 3a BROTT i ${targetFile}:`);
    console.error(`   Testet assertar på rå källkodstext ('export function' etc.) i stället för exekverbar logik!`);
    process.exit(1);
  }

  if (hasSpies && !hasRuntimeAnchor) {
    console.error(`❌ GATE 3a BROTT i ${targetFile}:`);
    console.error(`   Testet använder syntetiska spioner (vi.fn/vi.spyOn) utan fysiskt körtidsankare!`);
    process.exit(1);
  }

  console.log('✅ Gate 3a godkänd: Testet är fritt från alibin och förankrat mot körtid.');
  process.exit(0);
}

console.log('Ingen giltig flagga angiven till ts.js.');
