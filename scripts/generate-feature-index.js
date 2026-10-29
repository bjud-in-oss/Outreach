/**
 * scripts/generate-feature-index.js
 * 
 * OUTREACH COORDINATION ENGINE (v10.4)
 * Genererar doc/FEATURE_INDEX.json genom att parsa TypeScripts syntaxträd (AST).
 * Noll regex, 100 % deterministisk.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, 'src', 'features');
const OUT_FILE = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');

const featureIndex = { features: {} };

function isExported(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}

function scanFeature(featureName) {
  const featureDir = path.join(SRC_DIR, featureName);
  if (!fs.statSync(featureDir).isDirectory()) return;

  const files = [];
  const exportsList = [];

  function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '__tests__' || entry.name === 'doc') continue;
      
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const relPath = path.relative(featureDir, fullPath).replace(/\\/g, '/');
        files.push(relPath);

        const content = fs.readFileSync(fullPath, 'utf-8');
        const sf = ts.createSourceFile(fullPath, content, ts.ScriptTarget.Latest, true);

        // Parsa AST för att hitta faktiska exporter
        ts.forEachChild(sf, node => {
          // Namngivna exporter: export const foo = ... / export function bar()
          if (ts.isVariableStatement(node) && isExported(node)) {
            node.declarationList.declarations.forEach(d => {
              if (ts.isIdentifier(d.name)) exportsList.push(d.name.text);
            });
          } else if (ts.isFunctionDeclaration(node) && isExported(node) && node.name) {
            exportsList.push(node.name.text);
          } else if (ts.isClassDeclaration(node) && isExported(node) && node.name) {
            exportsList.push(node.name.text);
          }
          // Re-exporter: export { foo } from './bar'
          else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            node.exportClause.elements.forEach(el => exportsList.push(el.name.text));
          }
        });
      }
    }
  }

  scanDir(featureDir);
  
  // Ta bort dubbletter och sortera
  featureIndex.features[featureName] = {
    files: [...new Set(files)].sort(),
    exports: [...new Set(exportsList)].sort()
  };
}

console.log('🗺️  Skapar deterministisk resurskarta via TypeScript AST...');

if (fs.existsSync(SRC_DIR)) {
  for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      scanFeature(entry.name);
    }
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(featureIndex, null, 2), 'utf-8');
console.log(`✅ Karta genererad och sparad till ${path.relative(ROOT_DIR, OUT_FILE)}`);
