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
  const targetArg = args.find(a => !a.startsWith("--"));
  const srcDir = targetArg ? path.resolve(ROOT_DIR, targetArg) : path.join(ROOT_DIR, "src");
  console.log("   🎯 Målområde för Gate 2c: " + path.relative(ROOT_DIR, srcDir));
  let catchViolations = 0;
  let mockViolations = 0;

  function checkProdNode(node, filePath, sourceFile) {
    // Kontroll 6: Tysta catch-block
    if (ts.isCatchClause(node)) {
      const block = node.block;
      if (!block || block.statements.length === 0) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const lineText = sourceFile.text.split('\n')[line]?.trim() || '';
        console.error(`❌ GATE 2c BROTT: Tomt catch-block i ${path.relative(ROOT_DIR, filePath)}:${line + 1} -> ${lineText}`);
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

  function scan(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      if (targetPath.endsWith('.ts') || targetPath.endsWith('.tsx')) {
        const content = fs.readFileSync(targetPath, 'utf-8');
        const sf = ts.createSourceFile(targetPath, content, ts.ScriptTarget.Latest, true);
        checkProdNode(sf, targetPath, sf);
      }
      return;
    }
    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      const full = path.join(targetPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') scan(full);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf-8');
        const sf = ts.createSourceFile(full, content, ts.ScriptTarget.Latest, true);
        checkProdNode(sf, full, sf);
      }
    }
  }

  const targetArgs = args.filter(a => !a.startsWith("--"));
  if (targetArgs.length === 0) {
    scan(path.join(ROOT_DIR, "src"));
  } else {
    for (const t of targetArgs) {
      scan(path.resolve(ROOT_DIR, t));
    }
  }
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
  let hasTautologyAssertion = false;
  let hasSourceTextAssertion = false;
  let hasIllegalFsRead = false;
  let hasForbiddenPortFactoryMock = false;
  let forbiddenPortFactoryName = '';
  const PORT_FACTORIES = ['skapaAvsiktsport', 'skapaProvningsport', 'skapaKonstruktionsport', 'skapaBesiktningsport'];
  const isDirectFactoryTest = PORT_FACTORIES.some(pf => targetFile.toLowerCase().includes(pf.toLowerCase().replace('skapa', '')));

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

      if (!isDirectFactoryTest) {
        for (const pf of PORT_FACTORIES) {
          if (text === pf || text.startsWith(pf + '(') || text.endsWith('.' + pf)) {
            hasForbiddenPortFactoryMock = true;
            forbiddenPortFactoryName = pf;
          }
        }
      }
      for (const anchor of RUNTIME_ANCHORS) {
        if (text.includes(anchor)) hasRuntimeAnchor = true;
      }

      // Kontroll: Upptäck tautologiska alibi-assertions
      if (ts.isPropertyAccessExpression(node.expression)) {
        const matcherName = node.expression.name.getText(sf);
        if (['toBe', 'toEqual', 'toStrictEqual'].includes(matcherName)) {
          if (ts.isCallExpression(node.expression.expression) && 
              node.expression.expression.expression.getText(sf) === 'expect') {
            const expectArgs = node.expression.expression.arguments;
            const matcherArgs = node.arguments;

            if (expectArgs.length > 0 && matcherArgs.length > 0) {
              const arg1 = expectArgs[0];
              const arg2 = matcherArgs[0];

              let isTautology = false;

              // Booleska literaler
              if ((arg1.kind === ts.SyntaxKind.TrueKeyword && arg2.kind === ts.SyntaxKind.TrueKeyword) ||
                  (arg1.kind === ts.SyntaxKind.FalseKeyword && arg2.kind === ts.SyntaxKind.FalseKeyword)) {
                isTautology = true;
              }

              // Sträng eller Numeriska literaler
              if ((ts.isStringLiteral(arg1) && ts.isStringLiteral(arg2)) ||
                  (ts.isNumericLiteral(arg1) && ts.isNumericLiteral(arg2))) {
                if (arg1.text === arg2.text) {
                  isTautology = true;
                }
              }

              if (isTautology) {
                hasTautologyAssertion = true;
              }
            }
          }
        }
      }
    } else if (ts.isIdentifier(node)) {
      if (RUNTIME_ANCHORS.includes(node.text)) {
        hasRuntimeAnchor = true;
      }
    }
    ts.forEachChild(node, inspectTestNode);
  }

  inspectTestNode(sf);

  if (hasTautologyAssertion) { console.error(`❌ GATE 3a BROTT i ${targetFile}: Tautologisk alibi-assertion (t.ex. expect(true).toBe(true)) är förbjuden!`); process.exit(1); }
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

  if (hasForbiddenPortFactoryMock) {
    console.error(`❌ GATE 3a BROTT i ${targetFile}:`);
    console.error(`   Testet anropar '${forbiddenPortFactoryName}' som mock! Använd rena asynkrona lambdas (async () => ({ oppnad: true })) vid testning av recept/runners.`);
    process.exit(1);
  }

  if (hasSpies && !hasRuntimeAnchor) {
    console.error(`❌ GATE 3a BROTT i ${targetFile}:`);
    console.error(`   Testet använder syntetiska spioner (vi.fn/vi.spyOn) utan fysiskt körtidsankare!`);
    console.error(`   MÖNSTERSPÄRR: Ersätt vi.fn() med explicita AST-primitiver för att bryta låsningen.`);
    console.error(`   FULLSTÄNDIGT TYPISCRIPT-KODEXEMPEL SOM SKALL ANVÄNDAS:`);
    console.error(`   let anropad = false;`);
    console.error(`   const fn = () => { anropad = true; };`);
    console.error(`   // Använd 'fn' i din logik i stället för vi.fn()`);
    process.exit(1);
  }

  console.log('✅ Gate 3a godkänd: Testet är fritt från alibin och förankrat mot körtid.');
  process.exit(0);
}

console.log('Ingen giltig flagga angiven till ts.js.');
