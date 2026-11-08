import ts from 'typescript';

/**
 * Scope-medveten AST-mutator för Sanningsserum.
 * Identifierar och saboterar logiska invarianter inuti funktioner:
 * 1. Neutraliserar sidoeffekter (eventBus.emit / publish)
 * 2. Inverterar booleska returegenskaper (success: true -> false)
 */
export function mutateSourceCodeAST(sourceCode) {
  const sourceFile = ts.createSourceFile('candidate.ts', sourceCode, ts.ScriptTarget.Latest, true);
  const candidates = [];

  function isInsideFunction(node) {
    let parent = node.parent;
    while (parent) {
      if (
        ts.isFunctionDeclaration(parent) ||
        ts.isArrowFunction(parent) ||
        ts.isFunctionExpression(parent) ||
        ts.isMethodDeclaration(parent)
      ) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  function visit(node) {
    if (isInsideFunction(node)) {
      // 1. Sidoeffekt: Släck emit eller publish
      if (ts.isCallExpression(node)) {
        const text = node.expression.getText(sourceFile);
        if (text.endsWith('.emit') || text.endsWith('.publish')) {
          candidates.push({
            priority: 1,
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            replacement: '/* MUTATION */ undefined',
            description: "Neutraliserade sidoeffekt: '" + text + "(...)'"
          });
        }
      }

      // 2. Returvärde: Invertera boolean
      if (ts.isReturnStatement(node) && node.expression) {
        const expr = node.expression;
        if (ts.isObjectLiteralExpression(expr)) {
          for (const prop of expr.properties) {
            if (ts.isPropertyAssignment(prop) && prop.initializer) {
              if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                candidates.push({
                  priority: 2,
                  start: prop.initializer.getStart(sourceFile),
                  end: prop.initializer.getEnd(),
                  replacement: 'false',
                  description: "Inverterade returegenskap '" + prop.name.getText(sourceFile) + "': true -> false"
                });
              } else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                candidates.push({
                  priority: 2,
                  start: prop.initializer.getStart(sourceFile),
                  end: prop.initializer.getEnd(),
                  replacement: 'true',
                  description: "Inverterade returegenskap '" + prop.name.getText(sourceFile) + "': false -> true"
                });
              }
            }
          }
        } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
          candidates.push({
            priority: 2,
            start: expr.getStart(sourceFile),
            end: expr.getEnd(),
            replacement: 'false',
            description: 'Inverterade returvärde: true -> false'
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.priority - b.priority);
  const chosen = candidates[0];

  return {
    mutatedCode: sourceCode.slice(0, chosen.start) + chosen.replacement + sourceCode.slice(chosen.end),
    description: chosen.description
  };
}
