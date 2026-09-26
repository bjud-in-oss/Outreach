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
  Compass,
  Cpu,
  GitBranch,
} from 'lucide-react';
import { DevelopmentTicket } from '../telemetry/telemetrySchema.ts';

interface MasterDevelopmentPlanProps {
  currentReceiptHash?: string;
  className?: string;
}

export const MasterDevelopmentPlan: React.FC<MasterDevelopmentPlanProps> = ({
  currentReceiptHash = '08f90dfe',
  className = '',
}) => {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>('TCK-003');

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
      verifiedReceiptHash: '980bc67d',
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
        '20/20 Isolerade TDD-tester godkända',
      ],
      tokenHash: 'SWARM-TELEMETRY-TCK002-TOKEN',
      verifiedReceiptHash: '08f90dfe',
    },
    {
      id: 'TCK-003',
      title: 'Städning & SI v10.0 Arkitekturanpassning',
      status: 'AKTIV',
      phase: 'Fas 2: Verkställd & Verifierad',
      progressPercentage: 100,
      deliverables: [
        'Wayfinder-installation (.agents/skills/wayfinder/SKILL.md) & README-uppdatering',
        'Standardisering av Domänbeslut (src/features/[modul]/doc/DECISIONS.md) & ADR-004',
        'Agentkrafter: ATT_FORLIKAS, ATT_FOLJA, ATT_VANDA_OM i roleDefinitions & telemetrySchema',
        '4:e Seriella Motorn: Helautomatiserad obruten SI v10.0-pipeline (1a ➔ 1b ➔ 2e ➔ 3c ➔ 4)',
        'Dashboard & Telemetri UI-synkronisering med jämförelsepanel för Seriell Motor',
      ],
      tokenHash: 'OUTREACH-SI10-TCK003-TOKEN',
      verifiedReceiptHash: currentReceiptHash,
      wayfinderMap: 'doc/TICKETS.md (Steg 1a Dubbel Orientering)',
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
              Reaktiv styrkortsöversikt knuten till <span className="font-mono text-slate-300">doc/TICKETS.md</span> och{' '}
              <span className="font-mono text-slate-300">AGENTS.md (v10.0)</span>
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

      {/* Wayfinder Info Banner */}
      <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-start space-x-3">
        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 shrink-0">
          <Compass className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-purple-200">
            Wayfinder-orientering & SI v10.0 Processregler
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Vid oklara önskemål utan ticket-kod aktiveras Matt Pococks Wayfinder-skill under kraften{' '}
            <strong className="text-purple-300 font-mono">ATT_FORLIKAS</strong> för att rensa dimma och registrera tickets
            i <code className="text-purple-200">doc/TICKETS.md</code> utan att röra källkoden. Vid aktiv ticket karterar{' '}
            <strong className="text-blue-300 font-mono">ATT_FOLJA</strong> moduler och driver kedjan linjärt fram till Token Gate (Steg 3c).
          </p>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const isExpanded = expandedTicketId === ticket.id;
          const isVerified = ticket.status === 'VERIFIERAD';
          const isActive = ticket.status === 'AKTIV';

          return (
            <div
              key={ticket.id}
              className={`border rounded-xl transition-all ${
                isActive
                  ? 'bg-slate-950/80 border-purple-500/40 shadow-md shadow-purple-500/5'
                  : isVerified
                  ? 'bg-slate-950/50 border-slate-800/80'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-75'
              }`}
            >
              {/* Ticket Head */}
              <div
                onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isVerified
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isActive
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isActive ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Layers className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-300">{ticket.id}</span>
                      <span className="text-sm font-semibold text-slate-100">{ticket.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{ticket.phase}</span>
                      <span>•</span>
                      <span className="font-mono">{ticket.progressPercentage}% framsteg</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                      isVerified
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isActive
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
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

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isVerified ? 'bg-emerald-400' : 'bg-purple-500'
                        }`}
                        style={{ width: `${ticket.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Leveranser */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Verifierade Leveranser & Modularkitektur
                    </div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {ticket.deliverables.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Token & Receipt Info */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    {ticket.tokenHash && (
                      <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        <Terminal className="w-3 h-3 text-purple-400" />
                        <span>Token: {ticket.tokenHash}</span>
                      </div>
                    )}
                    {ticket.verifiedReceiptHash && (
                      <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Kvitto: {ticket.verifiedReceiptHash}</span>
                      </div>
                    )}
                    {ticket.wayfinderMap && (
                      <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        <Compass className="w-3 h-3 text-blue-400" />
                        <span>Karta: {ticket.wayfinderMap}</span>
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
