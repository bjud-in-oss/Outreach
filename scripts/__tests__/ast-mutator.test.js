import { describe, it, expect } from 'vitest';
import { mutateSourceCodeAST } from '../drivers/astMutator.js';

describe('AST Mutator', () => {
  it('should ignore global configuration and mutate function return value', () => {
    const sample1 = `
const IS_PROD = true;
export function emitPing() {
  return { success: true };
}
`;
    const res1 = mutateSourceCodeAST(sample1);
    expect(res1).not.toBeNull();
    expect(res1.mutatedCode).not.toContain('IS_PROD = false');
    expect(res1.mutatedCode).toContain('success: false');
  });

  it('should neutralize eventBus.emit side effects', () => {
    const sample2 = `
export function sendTelemetry(bus) {
  bus.emit('telemetry:ping', { ok: true });
  return { success: true };
}
`;
    const res2 = mutateSourceCodeAST(sample2);
    expect(res2).not.toBeNull();
    expect(res2.mutatedCode).toContain('/* MUTATION */ undefined');
  });
});
