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
    if (filterType === 'swarm') return env.type.startsWith('swarm.');
    if (filterType === 'drive') return env.type.startsWith('drive.');
    if (filterType === 'mcp') return env.type.startsWith('mcp.');
    return true;
  });

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
            <span>Aktiva</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.activeAgentsCount} / 4</div>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Genomströmning</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.eventsPerMinute} <span className="text-[10px] font-normal text-slate-400">evt/m</span></div>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-1">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Totalt</span>
          </div>
          <div className="text-sm font-bold text-slate-100">{snapshot.totalEventsCount}</div>
        </div>
      </div>

      {/* Agentstatus & Tankeström */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Agenttillstånd</span>
          <span className="text-[9px] font-mono text-slate-500">Event-driven</span>
        </div>

        <div className="space-y-1.5">
          {Object.values(snapshot.agentMetrics).map((agent) => (
            <div
              key={agent.agentId}
              className="p-2 bg-slate-950/50 border border-slate-800/60 rounded-lg text-xs flex flex-col space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-[11px] truncate">{agent.role}</span>
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
                <div className="text-[10px] text-slate-600 italic">Väntar på händelse...</div>
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
