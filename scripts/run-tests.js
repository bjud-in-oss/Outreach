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
import { runTransientTCK014Tests } from '../src/__tests__/transient_TCK-014.test.ts';
import { runTransientTCK015Tests } from '../src/__tests__/transient_TCK-015.test.ts';
import { runTransientTCK016Tests } from '../src/__tests__/transient_TCK-016.test.ts';
import { runTransientTCK017Tests } from '../src/__tests__/transient_TCK-017.test.ts';
import { runTransientTCK018Tests } from '../src/__tests__/transient_TCK-018.test.ts';
import { runTransientTCK019Tests } from '../src/__tests__/transient_TCK-019.test.ts';
import { runTransientTCK020Tests } from '../src/__tests__/transient_TCK-020.test.ts';
import { runTransientTCK020cTests } from '../src/__tests__/transient_TCK-020c.test.ts';
import { runTransientTCK020dTests } from '../src/__tests__/transient_TCK-020d.test.ts';
import { runTransientTCK021aTests } from '../src/__tests__/transient_TCK-021a.test.ts';
import { runTransientTCK021bTests } from '../src/__tests__/transient_TCK-021b.test.ts';
import { runTransientTCK022aTests } from '../src/__tests__/transient_TCK-022a.test.ts';
import { runTransientTCK022bTests } from '../src/__tests__/transient_TCK-022b.test.ts';
import { runTransientTCK022cTests } from '../src/__tests__/transient_TCK-022c.test.ts';
import { runTransientTCK022dTests } from '../src/__tests__/transient_TCK-022d.test.ts';

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
    { name: '18. Transient E2E: TCK-013 AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter', runner: async () => runTransientTCK013Tests() },
    { name: '19. Transient E2E: TCK-014 Åtgärda React Render-State Krock & Röstspår Telemetrisynk', runner: async () => runTransientTCK014Tests() },
    { name: '20. Transient E2E: TCK-015 Global Swarm Core, Systeminstruktions-synk & Bakgrundsöverlevnad', runner: async () => runTransientTCK015Tests() },
    { name: '21. Transient E2E: TCK-016 UI-Rensning, Monolit-Rasering & Purge av föråldrade FSD-komponenter', runner: async () => runTransientTCK016Tests() },
    { name: '22. Transient E2E: TCK-017 Symbol-Krona, Justerbar Split-Pane & Ren FSD-Layout', runner: async () => runTransientTCK017Tests() },
    { name: '23. Transient E2E: TCK-018 Integrerad Symbol-Krona, Immersiv Touch-Overlay & Exekveringskort', runner: async () => runTransientTCK018Tests() },
    { name: '24. Transient E2E: TCK-019 Silent OAuth Refresh & Drive Token Lifeline', runner: async () => runTransientTCK019Tests() },
    { name: '25. Transient E2E: TCK-020 Intent-Driven Audio, Responsive SplitPane & Adaptive Control Bar', runner: async () => runTransientTCK020Tests() },
    { name: '26. Transient E2E: TCK-020c Live Audio Piping, Extended Thinking & Bidi Tool Response', runner: async () => runTransientTCK020cTests() },
    { name: '27. Transient E2E: TCK-020d Sanering av geminiLiveSession.ts och tvingad v1alpha', runner: async () => runTransientTCK020dTests() },
    { name: '28. Transient E2E: TCK-021a VFS Staging Code Patch Engine & Unikhetsskydd', runner: async () => runTransientTCK021aTests() },
    { name: '29. Transient E2E: TCK-021b MCP Tool Wrapper for Code Patching & WAL Transaction', runner: async () => runTransientTCK021bTests() },
    { name: '30. Transient E2E: TCK-022a DSP Ring Buffer Mixer, Spatial Audio & Preemptive Floor Control', runner: async () => runTransientTCK022aTests() },
    { name: '31. Transient E2E: TCK-022b Bidi WebSocket Live MCP Wiring & Event-Driven Floor Release', runner: async () => runTransientTCK022bTests() },
    { name: '32. Transient E2E: TCK-022c VAD ZCR Softening & Continuous Microphone Stream Sync', runner: async () => runTransientTCK022cTests() },
    { name: '33. Transient E2E: TCK-022d Parallel 3-Agent Live Connection Setup & ThinkingConfig Schema Fix', runner: async () => runTransientTCK022dTests() },
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
