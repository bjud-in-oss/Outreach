import React, { useState } from 'react';
import {
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Hash,
} from 'lucide-react';
import { DevelopmentTicket } from '../telemetry/telemetrySchema.ts';

interface MasterDevelopmentPlanProps {
  currentReceiptHash?: string;
  className?: string;
}

export const MasterDevelopmentPlan: React.FC<MasterDevelopmentPlanProps> = ({
  currentReceiptHash = '698a4167',
  className = '',
}) => {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>('TCK-013');

  const tickets: DevelopmentTicket[] = [
    {
      id: 'TCK-013',
      title: 'AST-Miljöspärr mot Mockar, Autonom Handoff & Max 3 Agenter-kapacitet',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'AST-miljöspärr mot tysta mock-fallbacks och syntetiska genereringar i produktionsmoduler',
        'Fail-Fast: GeminiLiveSession sätter HALTED och GoogleDriveClient sätter UNAUTHENTICATED vid saknade nycklar/tokens',
        'Pedagogisk diagnostikpanel i gränssnittet som vägleder till Settings > Secrets',
        '100% UI-namnharmonisering för 4:e enheten ("Att tjäna Gud och andra: Bygga")',
        'Kapacitetsspärr: Max 3 samtidiga agenter i svärmen med deterministisk pausning',
        'Autonom handoff-slinga (1a till 3c) med reaktiv konsensusgranskning vid Token Gate (3c)',
        'Transient mikro-E2E-verifiering i transient_TCK-013.test.ts och regressionssviten',
      ],
      tokenHash: 'TCK-013-AUTONOM-HANDOFF-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-012',
      title: 'AST-Arkitekturspärrar, Greenfield UI-Nybygg & Skarp Agentkoppling',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Mekaniska AST-spärrar: max 125 rader .tsx, 250 rader .ts, max 4 indenteringsnivåer, max 5 villkor',
        'Greenfield UI under components/: SwarmHeader, SwarmUnitCard, SwarmStreamLog, SwarmControlPanel',
        'SwarmDashboard.tsx slimmad till ren samlingsvy under 100 rader',
        'Värnande av de 4 visningsnamnen och verbanropen (följa, vända, förlika, bygga 1-3)',
        'Skarp drift av 4:e agenten ("Att tjäna Gud och andra: Bygga") i båda arbetssätten',
        'Regressionskomplettering med transient_TCK-002 och transient_TCK-012 i e2e_regression.test.ts',
      ],
      tokenHash: 'TCK-012-GREENFIELD-UI-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-011',
      title: 'Tyst Röstspärr & Namnutlöst Ljudaktivering i Live-gränssnittet',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Tyst röstspärr (Silent Multistep Execution) som standard för auditiv arbetsro',
        'Strikta Zod-scheman för AudioOutputState och AudioTriggerReason (Fail-Fast)',
        'Deterministisk namndetektor detectUnitInvocation för de 4 försoningsenheterna',
        'Automatisk talaktivering vid Token Gate (Steg 3c_spec) för muntlig förankring',
        'Transient mikro-E2E-verifiering i transient_TCK-011.test.ts (< 3s i minnet)',
      ],
      tokenHash: 'TCK-011-SILENT-VOICE-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-010',
      title: 'Gemini Live Session Streaming & WebSocket Integration',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Dubbelriktad strömning av text och 16kHz PCM-ljud över WebSockets via Gemini 3.8 Live',
        'Strikta Zod-scheman för LiveSessionStatus och LiveStreamChunk (Fail-Fast)',
        'Reaktiv CloudEvents 1.0 distribution (swarm.live.*) till SwarmEventBus',
        'Direktkoppling till de 4 försoningsenheterna i gränssnittet för levande dialog',
        'Transient mikro-E2E-verifiering i transient_TCK-010.test.ts (< 3s i minnet)',
      ],
      tokenHash: 'TCK-010-LIVE-STREAMING-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-009',
      title: 'Konsolidering till 4 Försoningsenheter & UI-renodling',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Receptering bort av samtliga 5 legacy-roller ur källkoden',
        'Exakt 4 försoningsenheter (Att följa, Att vända om, Att förlikas, Att försonas)',
        'Exakta visningsnamn i UI: Att följa Guds son, Att vända om till Gud, Att förlikas med Gud, Att försonas (ensam agent)',
        'Minskning av översikten och telemetrin från 5 till 4 enheter',
        'Bevarande av SEMANTIC_INVARIANT ordagrant internt för agentprompt',
        'Transient test i transient_TCK-009.test.ts godkänt (< 3s)',
      ],
      tokenHash: 'TCK-009-FORSONINGSKRAFTER-REFACTOR-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-008',
      title: 'Förankring av Mognadsmodellen & Försoningskrafterna i Källkod och UI',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'SEMANTIC_INVARIANT etablerat i roleDefinitions.ts, AGENTS.md och doc/SI_v10.0.md',
        '3 vägar till försoning (Att Följa, Att Vända Om, Att Förlikas) + Seriell Motor',
        'Kompass & Högsta Syfte banner i SwarmDashboard',
        'Uppdaterade försoningstitlar och förklarande etiketter i TelemetrySidebar',
        'Transient mikro-E2E-verifiering i transient_TCK-008.test.ts (< 3s i minnet)',
      ],
      tokenHash: 'TCK-008-FORSONINGSKRAFTER-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-007',
      title: 'UI & Dashboard-övervakning av Seriell Motor',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Visualisering av SI v10.0-krafter på agentkort i SwarmDashboard',
        'Interaktiv sektion för 4:e Seriell Exekveringsmotor med pipelinesteg',
        '4-krafters sammanfattningspanel & reaktiv pipeline-telemetri i TelemetrySidebar',
        'Styrkortsregistrering i MasterDevelopmentPlan (TCK-006 & TCK-007)',
        'Transient mikro-E2E-verifiering (< 3s i minnet)',
      ],
      tokenHash: 'TCK-007-UI-SERIELL-MOTOR-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-006',
      title: 'Agentkrafter & 4:e Seriell Motor',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Grundläggande krafter (ATT_FORLIKAS, ATT_FOLJA, ATT_VANDA_OM) i roleDefinitions.ts',
        '4:e motorn SERIELL_MOTOR i DEFAULT_SWARM_ROLES',
        'Zod-scheman AgentForceSchema & SerialExecutionMetricSchema',
        'SwarmEventBus.publishSerialMetric() med CloudEvents 1.0 inkapsling',
        'ADR-SWARM-004 i doc/DECISIONS.md',
      ],
      tokenHash: 'TCK-006-SERIELL-MOTOR-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-005',
      title: 'Standardisering av Domänbeslut (DECISIONS.md)',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Central ADR-004 (Decentraliserad domänarkitektur) & ADR-005 (Token Gate)',
        'Lokala DECISIONS.md i samtliga 4 FSD-moduler (SWARM, DRIVE, MCP, WAL)',
        'Transient mikro-E2E-verifiering och konsolidering till regression',
      ],
      tokenHash: 'TCK-005-DECISIONS-STD-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-004',
      title: 'Wayfinder-installation & README-uppdatering',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Wayfinder skill-paket (.agents/skills/wayfinder/)',
        'pnpm planera och pnpm genomfor integrationsstöd',
        'Uppdaterad README.md med SI v10.0-rutiner',
      ],
      tokenHash: 'WAYFINDER-README-TCK004-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-002',
      title: 'Swarm Telemetry & Reactive Status',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Reaktiv pub/sub-händelsebuss (SwarmEventBus)',
        'Telemetri Zod-schema och modeller (telemetrySchema.ts)',
        'useSwarmTelemetry hook med genomströmningsberäkning',
        'TelemetrySidebar med agentpuls och händelseström',
        'MasterDevelopmentPlan reaktivt styrkort',
      ],
      tokenHash: 'SWARM-TELEMETRY-TCK002-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-001',
      title: 'Initialisera Outreach Samordningsmotor',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'FSD Grundstruktur (google_drive_sync, wal_logger, mcp_bridge, gemini_live_swarm)',
        'EventEnvelope (CloudEvents 1.0) & Zod-validering',
        'Google Drive Workspace Initieringsskript',
        'README.md med filosofiskt personligt brev',
        '15/15 Isolerade TDD-tester godkända',
      ],
      tokenHash: 'OUTREACH-COORD-TCK001-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
    {
      id: 'TCK-003',
      title: 'MCP Bridge & Gemini Live Swarm Djupintegration',
      status: 'VERIFIERAD',
      phase: 'Fas 2: Slutförd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'McpSwarmBridge med automatisk NON_BLOCKING Bidi tool-respons',
        'createUnifiedMcpServer med Drive-, WAL- och Kvalitetsanalysverktyg',
        'Reaktiv CloudEvents 1.0-distribution till SwarmEventBus',
        'Djupintegration i SwarmOrchestrator för automatisk Drive-sparning och granskning',
        'Transient mikro-E2E-verifiering i transient_TCK-003.test.ts (< 3s i minnet)',
      ],
      tokenHash: 'TCK-003-MCP-SWARM-BRIDGE-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
    },
  ];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Master Development Plan (Styrkort)</h2>
            <p className="text-xs text-slate-400">
              Reaktiv styrkortsöversikt knuten till <span className="font-mono text-slate-300">doc/TICKETS.md</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300">
            <Hash className="w-3.5 h-3.5 text-blue-400" />
            <span>Kvittohash: {currentReceiptHash}</span>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const isExpanded = expandedTicketId === ticket.id;
          return (
            <div
              key={ticket.id}
              className={`rounded-xl border transition-all ${
                ticket.status === 'AKTIV'
                  ? 'bg-slate-950/80 border-purple-500/40 ring-1 ring-purple-500/20'
                  : ticket.status === 'VERIFIERAD'
                  ? 'bg-slate-950/40 border-slate-800/80'
                  : 'bg-slate-950/20 border-slate-900 text-slate-500'
              }`}
            >
              <div
                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      ticket.status === 'VERIFIERAD'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ticket.status === 'AKTIV'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ticket.status === 'VERIFIERAD' ? '✓' : ticket.id.slice(-2)}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{ticket.id}:</span>
                      <span className="text-xs font-semibold text-slate-100 truncate">{ticket.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{ticket.phase}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[11px] font-mono text-slate-300">{ticket.progressPercentage}%</span>
                    <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full ${
                          ticket.status === 'VERIFIERAD'
                            ? 'bg-emerald-500'
                            : ticket.status === 'AKTIV'
                            ? 'bg-purple-500'
                            : 'bg-slate-700'
                        }`}
                        style={{ width: `${ticket.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      ticket.status === 'VERIFIERAD'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : ticket.status === 'AKTIV'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ticket.status}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 space-y-3">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Leverabler & Acceptanskriterier
                    </h4>
                    <ul className="space-y-1">
                      {ticket.deliverables.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                              ticket.status === 'VERIFIERAD' || (ticket.status === 'AKTIV' && idx < 4)
                                ? 'text-emerald-400'
                                : 'text-slate-600'
                            }`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/40 text-[11px] font-mono">
                    {ticket.tokenHash && (
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-400">
                        <span className="text-slate-500">Token: </span>
                        <span className="text-purple-300 font-semibold">{ticket.tokenHash}</span>
                      </div>
                    )}
                    {ticket.verifiedReceiptHash && (
                      <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-400">
                        <span className="text-slate-500">Arkitekturkvitto: </span>
                        <span className="text-emerald-400 font-semibold">{ticket.verifiedReceiptHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
