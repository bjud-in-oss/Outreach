import { runEnvelopeTests } from '../src/__tests__/envelope.test.ts';
import { runWalTests } from '../src/__tests__/wal_logger.test.ts';
import { runDriveSyncTests } from '../src/__tests__/drive_sync.test.ts';
import { runMcpBridgeTests } from '../src/__tests__/mcp_bridge.test.ts';
import { runSwarmTests } from '../src/__tests__/gemini_swarm.test.ts';
import { runSwarmTelemetryTests } from '../src/__tests__/swarm_telemetry.test.ts';
import { runTransientTCK003Tests } from '../src/__tests__/transient_TCK-003.test.ts';

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
    { name: '7. Transient Mikro-E2E (TCK-003 & SI v10.0)', runner: async () => runTransientTCK003Tests() },
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
