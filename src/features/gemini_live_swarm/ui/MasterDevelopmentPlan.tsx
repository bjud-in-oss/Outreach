import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Hash,
  Terminal,
} from 'lucide-react';
import { DevelopmentTicket } from '../telemetry/telemetrySchema.ts';

interface MasterDevelopmentPlanProps {
  currentReceiptHash?: string;
  className?: string;
}

export const MasterDevelopmentPlan: React.FC<MasterDevelopmentPlanProps> = ({
  currentReceiptHash = '1e9e1478',
  className = '',
}) => {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>('TCK-002');

  const tickets: DevelopmentTicket[] = [
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
      id: 'TCK-002',
      title: 'Swarm Telemetry & Reactive Status',
      status: 'AKTIV',
      phase: 'Fas 2: Verkställande & TDD',
      progressPercentage: 85,
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
      id: 'TCK-003',
      title: 'MCP Bridge & Gemini Live Swarm Djupintegration',
      status: 'VÄNTAR',
      phase: 'Fas 1: Planerad',
      progressPercentage: 0,
      deliverables: [
        'Externa agentkopplingar över JSON-RPC 2.0',
        'Automatiserad pipeline för Drive-publicering',
        'Multi-session realtidsorkestrering',
      ],
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
