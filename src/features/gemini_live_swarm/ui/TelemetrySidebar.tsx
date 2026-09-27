import React, { useState } from 'react';
import {
  Activity,
  Bot,
  Zap,
  Radio,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Workflow,
  Lock,
  Compass,
} from 'lucide-react';
import { useSwarmTelemetry } from '../telemetry/useSwarmTelemetry.ts';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { AgentForce, DEFAULT_SWARM_ROLES } from '../agents/roleDefinitions.ts';

interface TelemetrySidebarProps {
  eventBus?: SwarmEventBus;
  className?: string;
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({ eventBus, className = '' }) => {
  const { snapshot } = useSwarmTelemetry(eventBus);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEnvelopes = snapshot.recentEnvelopes.filter((env) => {
    if (filterType === 'all') return true;
    if (filterType === 'swarm') return env.type.startsWith('swarm.');
    if (filterType === 'drive') return env.type.startsWith('drive.');
    if (filterType === 'mcp') return env.type.startsWith('mcp.');
    return true;
  });

  const getForceBadge = (force?: AgentForce) => {
    switch (force) {
      case 'ATT_FORLIKAS':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            FÖRLIKAS
          </span>
        );
      case 'ATT_FOLJA':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
            FÖLJA
          </span>
        );
      case 'ATT_VANDA_OM':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            VÄNDA OM
          </span>
        );
      case 'SERIELL_MOTOR':
        return (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            SERIELL
          </span>
        );
      default:
        return null;
    }
  };

  const formatStage = (stage?: string) => {
    if (!stage) return 'Inaktiv';
    switch (stage) {
      case '1a_forsta':
        return '1a Förstå';
      case '1b_kartlagga':
        return '1b Kartlägga';
      case '2a_avgransa':
        return '2a Avgränsa';
      case '2b_modellera':
        return '2b Modellera';
      case '2e_syntetisera':
        return '2e Syntetisera';
      case '3c_spec':
        return '3c Specifikation';
      case 'e2e_verify':
        return 'E2E Verifiera';
      default:
        return stage;
    }
  };

  const totalAgents = Object.values(snapshot.agentMetrics).length;
  const activeCount = Object.values(snapshot.agentMetrics).filter((a) => a.status !== 'ERROR').length;

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col space-y-4 ${className}`}
    >
      {/* Header & Health Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-1.5">
              <span>Swarm Telemetri & Puls</span>
            </h3>
            <p className="text-[10px] text-slate-400">Reaktiv tillståndsövervakning (SI v10.0)</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{snapshot.healthStatus}</span>
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1">
            <Bot className="w-3 h-3 text-purple-400" />
            <span>Enheter</span>
          </div>
          <div className="text-sm font-bold text-slate-100">
            {activeCount} / {totalAgents || 5}
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Genomströmning</span>
          </div>
          <div className="text-sm font-bold text-slate-100">
            {snapshot.eventsPerMinute} <span className="text-[10px] font-normal text-slate-400">evt/m</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Totalt</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.totalEventsCount}</div>
        </div>
      </div>

      {/* 4-Krafters Sammanfattningspanel (SI v10.0) */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Agentdynamik & Krafter</span>
          </span>
          <span className="text-[9px] font-mono text-slate-500">4 Motorer</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="p-2 bg-slate-950/60 border border-purple-500/20 rounded-lg">
            <div className="font-semibold text-purple-300">ATT FÖRLIKAS</div>
            <div className="text-[9px] text-slate-400">Hålla 2+ samtida perspektiv varma</div>
          </div>
          <div className="p-2 bg-slate-950/60 border border-blue-500/20 rounded-lg">
            <div className="font-semibold text-blue-300">ATT FÖLJA</div>
            <div className="text-[9px] text-slate-400">Själv vara lösningen för närhet</div>
          </div>
          <div className="p-2 bg-slate-950/60 border border-amber-500/20 rounded-lg">
            <div className="font-semibold text-amber-300">ATT VÄNDA OM</div>
            <div className="text-[9px] text-slate-400">Inåtriktad ödmjukhet & Fail-Fast</div>
          </div>
          <div className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded-lg">
            <div className="font-semibold text-cyan-300">SERIELL MOTOR</div>
            <div className="text-[9px] text-slate-400">Deterministisk ordning & skydd</div>
          </div>
        </div>
      </div>

      {/* Reaktiv Visualisering av Seriell Exekvering */}
      <div className="p-2.5 bg-slate-950/80 border border-cyan-500/30 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Workflow className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
              Seriell Exekvering
            </span>
          </div>
          {snapshot.serialExecution?.isTokenGated && (
            <span className="flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <Lock className="w-2.5 h-2.5" />
              <span>TOKEN GATE</span>
            </span>
          )}
        </div>

        {snapshot.serialExecution ? (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Fas:</span>
              <span className="text-cyan-300 font-bold">
                {formatStage(snapshot.serialExecution.currentStage)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Status:</span>
              <span
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                  snapshot.serialExecution.stageStatus === 'GATED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : snapshot.serialExecution.stageStatus === 'COMPLETED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {snapshot.serialExecution.stageStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Körtid:</span>
              <span className="text-slate-300">{snapshot.serialExecution.durationMs} ms</span>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic py-1 text-center">
            Väntar på signal från seriell exekveringsmotor...
          </div>
        )}
      </div>

      {/* Agentstatus & Tankeström (5 Enheter) */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Enhetsstatus & Puls (5 Enheter)</span>
          <span className="text-[9px] font-mono text-slate-500">Event-driven</span>
        </div>

        <div className="space-y-1.5">
          {Object.values(snapshot.agentMetrics).map((agent) => (
            <div
              key={agent.agentId}
              className={`p-2 bg-slate-950/50 border rounded-lg text-xs flex flex-col space-y-1 ${
                agent.role === 'SERIELL_MOTOR' ? 'border-cyan-500/30' : 'border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="font-semibold text-slate-200 text-[11px] truncate">
                    {DEFAULT_SWARM_ROLES[agent.role]?.name || agent.role}
                  </span>
                  {getForceBadge(agent.force)}
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    agent.status === 'THINKING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : agent.status === 'DONE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              {agent.lastThought ? (
                <div className="text-[10px] text-slate-400 italic line-clamp-1">
                  "{agent.lastThought}"
                </div>
              ) : (
                <div className="text-[10px] text-slate-600 italic">
                  {agent.totalEventsEmitted > 0
                    ? `${agent.totalEventsEmitted} händelser bearbetade`
                    : 'Väntar på händelse...'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Levande Händelselogg */}
      <div className="space-y-2 pt-1 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Händelseström ({filteredEnvelopes.length})
          </span>
          <div className="flex items-center space-x-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
            >
              <option value="all">Alla</option>
              <option value="swarm">Svärm</option>
              <option value="drive">Drive</option>
              <option value="mcp">MCP</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredEnvelopes.length === 0 ? (
            <div className="text-[11px] text-slate-600 text-center py-4 italic">
              Inga händelser i bufferten än...
            </div>
          ) : (
            filteredEnvelopes.map((env) => (
              <div
                key={env.id}
                className="p-1.5 bg-slate-950/70 border border-slate-800/70 rounded text-[10px] flex items-center justify-between space-x-2"
              >
                <div className="truncate flex-1">
                  <div className="font-mono text-purple-300 truncate">{env.type}</div>
                  <div className="text-slate-500 text-[9px] truncate">{env.source}</div>
                </div>
                <div className="text-[9px] font-mono text-slate-500 shrink-0">
                  {new Date(env.time).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

