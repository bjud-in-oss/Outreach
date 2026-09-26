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
  GitBranch,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useSwarmTelemetry } from '../telemetry/useSwarmTelemetry.ts';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';

interface TelemetrySidebarProps {
  eventBus?: SwarmEventBus;
  className?: string;
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({ eventBus, className = '' }) => {
  const { snapshot } = useSwarmTelemetry(eventBus);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEnvelopes = snapshot.recentEnvelopes.filter((env) => {
    if (filterType === 'all') return true;
    if (filterType === 'krafter') return env.type.startsWith('swarm.kraft.');
    if (filterType === 'seriell') return env.type.startsWith('swarm.seriell_motor');
    if (filterType === 'swarm') return env.type.startsWith('swarm.');
    if (filterType === 'drive') return env.type.startsWith('drive.');
    if (filterType === 'mcp') return env.type.startsWith('mcp.');
    if (filterType === 'wal') return env.type.startsWith('wal.');
    return true;
  });

  const getKraftBadge = (role: string) => {
    switch (role) {
      case 'ATT_FORLIKAS':
        return { label: 'Wayfinder 1a / Dörrvakt', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'ATT_FOLJA':
        return { label: 'Skapare & Exekutör', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'ATT_VANDA_OM':
        return { label: 'Granskare & Mikro-E2E', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'SERIELL_MOTOR':
        return { label: 'Linjär SI v10.0 Pipeline', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: role, color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

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
              <span>SI v10.0 Telemetri & Puls</span>
            </h3>
            <p className="text-[10px] text-slate-400">Reaktiv tillståndsövervakning (CloudEvents 1.0)</p>
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
            <span>Aktiva Krafter</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.activeAgentsCount} / 4</div>
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
            <span>Händelser</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.totalEventsCount}</div>
        </div>
      </div>

      {/* Agentstatus & Krafter */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Agentkrafter & Motor</span>
          <span className="text-[9px] font-mono text-slate-500">SI v10.0</span>
        </div>

        <div className="space-y-2">
          {Object.values(snapshot.agentMetrics).map((agent) => {
            const badge = getKraftBadge(agent.role);
            return (
              <div
                key={agent.agentId}
                className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs flex flex-col space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {agent.role === 'SERIELL_MOTOR' ? (
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    ) : agent.role === 'ATT_FORLIKAS' ? (
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                    ) : agent.role === 'ATT_FOLJA' ? (
                      <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="font-semibold text-slate-200 text-[11px]">{agent.role}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                      agent.status === 'THINKING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        : agent.status === 'DONE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : agent.status === 'ERROR'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-slate-400 font-mono text-[9px]">{agent.totalEventsEmitted} evts</span>
                </div>

                {agent.lastThought && (
                  <div className="p-1.5 bg-slate-900 rounded border border-slate-800/60 text-[10px] text-slate-300 italic line-clamp-2">
                    "{agent.lastThought}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter för händelseström */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <div className="flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Reaktiv Händelseström</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">({filteredEnvelopes.length})</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {['all', 'krafter', 'seriell', 'drive', 'mcp', 'wal'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                filterType === f
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Strömlista */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredEnvelopes.length === 0 ? (
            <div className="text-center py-6 text-[11px] text-slate-500 italic">
              Inga händelser matchar filtret
            </div>
          ) : (
            filteredEnvelopes.map((env) => (
              <div
                key={env.id}
                className="p-1.5 bg-slate-950/70 border border-slate-800/60 rounded text-[10px] font-mono space-y-0.5"
              >
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-purple-400 truncate max-w-[140px]">{env.type}</span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(env.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">
                  src: <span className="text-slate-300">{env.source}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
