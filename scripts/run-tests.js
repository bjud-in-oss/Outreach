import { runEnvelopeTests } from '../src/__tests__/envelope.test.ts';
import { runWalTests } from '../src/__tests__/wal_logger.test.ts';
import { runDriveSyncTests } from '../src/__tests__/drive_sync.test.ts';
import { runMcpBridgeTests } from '../src/__tests__/mcp_bridge.test.ts';
import { runSwarmTests } from '../src/__tests__/gemini_swarm.test.ts';
import { runSwarmTelemetryTests } from '../src/__tests__/swarm_telemetry.test.ts';
import { runTransientTCK004Tests } from '../src/__tests__/transient_TCK-004.test.ts';
import { runTransientTCK005Tests } from '../src/__tests__/transient_TCK-005.test.ts';
import { runTransientTCK006Tests } from '../src/__tests__/transient_TCK-006.test.ts';
import { runTransientTCK007Tests } from '../src/__tests__/transient_TCK-007.test.ts';
import { runTransientTCK008Tests } from '../src/__tests__/transient_TCK-008.test.ts';
import { runTransientTCK009Tests } from '../src/__tests__/transient_TCK-009.test.ts';
import { runTransientTCK003Tests } from '../src/__tests__/transient_TCK-003.test.ts';
import { runTransientTCK010Tests } from '../src/__tests__/transient_TCK-010.test.ts';
import { runTransientTCK011Tests } from '../src/__tests__/transient_TCK-011.test.ts';
import { runTransientTCK002Tests } from '../src/__tests__/transient_TCK-002.test.ts';
import { runTransientTCK012Tests } from '../src/__tests__/transient_TCK-012.test.ts';
import { runTransientTCK013Tests } from '../src/__tests__/transient_TCK-013.test.ts';

async function main() {
  console.log('🧪 [TEST-RUNNER] Kör isolerade TDD-enhetstester i src/__tests__/...\n');

  let totalPassed = 0;
  let totalFailed = 0;

  const testSuites = [
    { name: '1. Event Envelope Schema (CloudEvents)', runner: async () => runEnvelopeTests() },
    { name: '2. Write-Ahead Logger & Crash Recovery', runner: async () => runWalTests() },
    { name: '3. Google Drive Sync & Workspace', runner: async () => runDriveSyncTests() },
    { name: '4. MCP Bridge & JSON-RPC 2.0', runner: async () => runMcpBridgeTests() },
    { name: '5. Gemini Live Swarm Orchestration', runner: async () => runSwarmTests() },
    { name: '6. Swarm Telemetry & Reactive Event Bus', runner: async () => runSwarmTelemetryTests() },
    { name: '7. Transient E2E: TCK-004 Wayfinder & SI v10.0', runner: async () => runTransientTCK004Tests() },
    { name: '8. Transient E2E: TCK-005 Standardisering av Domänbeslut', runner: async () => runTransientTCK005Tests() },
    { name: '9. Transient E2E: TCK-006 Agentkrafter & 4:e Seriell Motor', runner: async () => runTransientTCK006Tests() },
    { name: '10. Transient E2E: TCK-007 UI & Dashboard-övervakning av Seriell Motor', runner: async () => runTransientTCK007Tests() },
    { name: '11. Transient E2E: TCK-008 Mognadsmodell & Försoningskrafter', runner: async () => runTransientTCK008Tests() },
    { name: '12. Transient E2E: TCK-009 Konsolidering till 4 Försoningsenheter', runner: async () => runTransientTCK009Tests() },
    { name: '13. Transient E2E: TCK-003 MCP Bridge & Gemini Live Swarm Djupintegration', runner: async () => runTransientTCK003Tests() },
    { name: '14. Transient E2E: TCK-010 Gemini Live Session Streaming & WebSocket Integration', runner: async () => runTransientTCK010Tests() },
    { name: '15. Transient E2E: TCK-011 Tyst Röstspärr & Namnutlöst Ljudaktivering', runner: async () => runTransientTCK011Tests() },
    { name: '16. Transient E2E: TCK-002 Swarm Telemetry & Reactive Event Bus', runner: async () => runTransientTCK002Tests() },
    { name: '17. Transient E2E: TCK-012 AST-Arkitekturspärrar, Greenfield UI & Skarp Agentkoppling', runner: async () => runTransientTCK012Tests() },
  ];

  for (const suite of testSuites) {
    console.log(`▶️ ${suite.name}`);
    const results = await suite.runner();
    for (const r of results) {
      if (r.passed) {
        console.log(`   ✅ PASS: ${r.name}`);
        totalPassed++;
      } else {
        console.error(`   ❌ FAIL: ${r.name} - ${r.error || 'Okänt fel'}`);
        totalFailed++;
      }
    }
    console.log('');
  }

  console.log('====================================');
  console.log(`Totalt: ${totalPassed + totalFailed} tester | Godkända: ${totalPassed} | Misslyckade: ${totalFailed}`);
  console.log('====================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Testkörningsfel:', err);
  process.exit(1);
});
