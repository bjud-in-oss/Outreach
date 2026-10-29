import assert from 'node:assert';
import { mutateSourceCodeAST } from '../drivers/astMutator.js';

console.log('🧪 Verifierar AST-mutatorn med ESM-TDD...\n');

// Test 1: Global konfiguration ignoreras, funktionens returvärde muteras
const sample1 = `
const IS_PROD = true;
export function emitPing() {
  return { success: true };
}
`;
const res1 = mutateSourceCodeAST(sample1);
assert(res1 !== null, 'Test 1 fel: Returnerade null');
assert(!res1.mutatedCode.includes('IS_PROD = false'), 'Test 1 fel: Saboterade global variabel');
assert(res1.mutatedCode.includes('success: false'), 'Test 1 fel: Funktionens success muterades inte');
console.log('  ✅ Test 1 godkänt: Scope-isolering fungerar (global config orörd).');

// Test 2: Sidoeffekter (eventBus.emit) släcks
const sample2 = `
export function sendTelemetry(bus) {
  bus.emit('telemetry:ping', { ok: true });
  return { success: true };
}
`;
const res2 = mutateSourceCodeAST(sample2);
assert(res2 !== null, 'Test 2 fel: Returnerade null');
assert(res2.mutatedCode.includes('/* MUTATION */ undefined'), 'Test 2 fel: Sidoeffekt släcktes inte');
console.log('  ✅ Test 2 godkänt: Händelsebuss-sidoeffekt neutraliseras med högsta prioritet.');

console.log('\n🎉 ALLA TDD-TESTER GODKÄNDA FÖR AST-MUTATORN!');
