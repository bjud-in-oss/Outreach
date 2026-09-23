import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Bot,
  Activity,
  Server,
  Layers,
  FileCheck2,
  RefreshCw,
  Terminal,
  ShieldAlert,
  Play,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { DriveSyncPanel, useDriveStore } from './features/google_drive_sync/index.ts';
import { WalEngine, WalEntry, WalReplayer } from './features/wal_logger/index.ts';
import { createStandardMcpServer, McpServer, McpToolDefinition } from './features/mcp_bridge/index.ts';
import { SwarmOrchestrator, SwarmDashboard, CampaignPlan } from './features/gemini_live_swarm/index.ts';
import { EventEnvelope } from './shared/contracts/envelope.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'swarm' | 'drive' | 'wal' | 'mcp' | 'letter'>('swarm');

  // Skapa beständiga instanser
  const walEngineRef = useRef<WalEngine>(new WalEngine());
  const mcpServerRef = useRef<McpServer>(createStandardMcpServer());
  const orchestratorRef = useRef<SwarmOrchestrator>(new SwarmOrchestrator());

  const [walEntries, setWalEntries] = useState<WalEntry[]>([]);
  const [mcpTools, setMcpTools] = useState<McpToolDefinition[]>([]);
  const [mcpLog, setMcpLog] = useState<string>('');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayNotice, setReplayNotice] = useState<string | null>(null);

  // Synka initialt tillstånd
  useEffect(() => {
    setWalEntries(walEngineRef.current.getWalHistory());
    setMcpTools(mcpServerRef.current.getRegisteredTools());

    // Lägg till en initial boot-händelse i WAL
    const initialBootEnvelope: EventEnvelope = {
      id: 'boot-evt-1',
      source: 'outreach/system',
      type: 'system.boot.completed',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { system: 'Outreach Samordningsmotor', version: '1.0.0', status: 'ONLINE' },
      correlationId: 'boot-run',
    };

    walEngineRef.current.appendWalEntry(initialBootEnvelope).then((entry) => {
      walEngineRef.current.commitWalEntry(entry.sequenceNumber).then(() => {
        setWalEntries(walEngineRef.current.getWalHistory());
      });
    });
  }, []);

  const handleEmitEvent = async (source: string, type: string, data: any) => {
    const envelope: EventEnvelope = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source,
      type,
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data,
    };

    // Skriv till WAL före sidoeffekter (Write-Ahead)
    const entry = await walEngineRef.current.appendWalEntry(envelope);
    setWalEntries(walEngineRef.current.getWalHistory());

    // Simulera snabb commit
    setTimeout(async () => {
      await walEngineRef.current.commitWalEntry(entry.sequenceNumber);
      setWalEntries(walEngineRef.current.getWalHistory());
    }, 400);
  };

  const handleReplayUncommitted = async () => {
    setIsReplaying(true);
    setReplayNotice(null);
    try {
      const replayer = new WalReplayer(walEngineRef.current);
      const res = await replayer.replayUncommittedEntries(async (entry) => {
        // Återspelar transaktionen
        console.log(`Replaying transaction #${entry.sequenceNumber}:`, entry.envelope.type);
      });
      setReplayNotice(`Återhämtning klar: ${res.replayedCount} transaktioner återställda.`);
      setWalEntries(walEngineRef.current.getWalHistory());
    } catch (err: any) {
      setReplayNotice(`Fel vid återhämtning: ${err.message}`);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleTestMcpCall = async (toolName: string) => {
    setMcpLog(`[MCP Request] Anropar ${toolName}...`);
    const res = await mcpServerRef.current.handleJsonRpcRequest({
      jsonrpc: '2.0',
      id: `req-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments:
          toolName === 'drive_create_file'
            ? { fileName: 'Outreach_Strategi_2026.md', content: '# Strategi för Outreach\nAutonoma arbetsflöden.' }
            : { limit: 5 },
      },
    });
    setMcpLog(JSON.stringify(res, null, 2));

    await handleEmitEvent('outreach/mcp-bridge', 'mcp.tool.executed', {
      tool: toolName,
      status: res.result ? 'SUCCESS' : 'ERROR',
    });
  };

  const handleCampaignComplete = async (plan: CampaignPlan) => {
    await handleEmitEvent('outreach/swarm/orchestrator', 'swarm.campaign.completed', {
      planId: plan.id,
      consensusScore: plan.consensusScore,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toppnavigering */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg shadow-md shadow-blue-500/10">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-white">Outreach Samordningsmotor</h1>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                  v1.0.0
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  TCK-001 AKTIV
                </span>
              </div>
              <p className="text-xs text-slate-400">Google Workspace • MCP Bridge • WAL Logger • Gemini Live Swarm</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('swarm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'swarm' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Svärmorkestrering</span>
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'drive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span className="hidden sm:inline">Google Drive</span>
            </button>
            <button
              onClick={() => setActiveTab('wal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'wal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">WAL Logg ({walEntries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'mcp' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">MCP Bridge</span>
            </button>
            <button
              onClick={() => setActiveTab('letter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'letter' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Det Personliga Brevet</span>
            </button>
          </div>
        </div>
      </header>

      {/* Huvudinnehåll */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Flik 1: Gemini Live Swarm */}
        {activeTab === 'swarm' && (
          <div className="space-y-6">
            <SwarmDashboard
              orchestrator={orchestratorRef.current}
              onCampaignComplete={handleCampaignComplete}
              onEventEmitted={handleEmitEvent}
            />
          </div>
        )}

        {/* Flik 2: Google Drive Workspace */}
        {activeTab === 'drive' && (
          <div className="space-y-6">
            <DriveSyncPanel onNotifyEvent={handleEmitEvent} />
          </div>
        )}

        {/* Flik 3: Write-Ahead Log (WAL) */}
        {activeTab === 'wal' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Write-Ahead Logg (Transaktionshistorik)</h2>
                  <p className="text-xs text-slate-400">
                    Oföränderlig transaktionslogg (EventEnvelope v1.0) med sekvensering och crash recovery
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReplayUncommitted}
                  disabled={isReplaying}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
                  <span>Kör Crash Recovery</span>
                </button>
              </div>
            </div>

            {replayNotice && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                {replayNotice}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Seq #</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Händelsekälla</th>
                    <th className="p-2.5">Händelsetyp</th>
                    <th className="p-2.5">Hash</th>
                    <th className="p-2.5">Tidpunkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {walEntries.slice().reverse().map((entry) => (
                    <tr key={entry.sequenceNumber} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono font-medium text-slate-100">#{entry.sequenceNumber}</td>
                      <td className="p-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            entry.status === 'COMMITTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : entry.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">{entry.envelope.source}</td>
                      <td className="p-2.5 text-slate-200 font-medium">{entry.envelope.type}</td>
                      <td className="p-2.5 font-mono text-[10px] text-slate-500">{entry.entryHash}</td>
                      <td className="p-2.5 text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flik 4: MCP Bridge */}
        {activeTab === 'mcp' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Model Context Protocol (MCP) Bridge</h2>
                  <p className="text-xs text-slate-400">
                    JSON-RPC 2.0 protokollanslutning för externa verktyg och agentklienter
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Registrerade MCP-Verktyg ({mcpTools.length})
                </h3>
                <div className="space-y-2">
                  {mcpTools.map((t) => (
                    <div
                      key={t.name}
                      className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-amber-300">{t.name}</div>
                        <div className="text-[11px] text-slate-400">{t.description}</div>
                      </div>
                      <button
                        onClick={() => handleTestMcpCall(t.name)}
                        className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        Testa Anrop
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  JSON-RPC 2.0 Diagnostik & Respons
                </h3>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 min-h-[160px] overflow-auto whitespace-pre-wrap">
                  {mcpLog || '// Klicka på "Testa Anrop" för att köra verktygsanrop över JSON-RPC 2.0...'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Flik 5: Det Personliga Brevet */}
        {activeTab === 'letter' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-lg max-w-4xl mx-auto space-y-6 leading-relaxed">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>✉️ Det Personliga Brevet: Samordningsmotorns Filosofi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Till arkitekter, utvecklare och verksamhetsbyggare</p>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p className="italic text-slate-400">
                "När vi betraktar dagens landskap av AI-verktyg och outreach-automation ser vi ofta två ytterligheter: antingen stängda, opaka molntjänster där användaren förlorar insyn och ägarskap över sina data – eller fragmenterade skript som saknar tillförlitlighet och havererar vid minsta nätverkshicka."
              </p>

              <p>
                Denna samordningsmotor föddes ur en grundläggande övertygelse: <strong>Automation måste vara transparent, motståndskraftig och samarbetsvillig.</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <h3 className="text-xs font-bold text-blue-400">1. Ägarskap i Google Drive</h3>
                  <p className="text-xs text-slate-400">
                    Dina tillgångar stannar i ditt befintliga ekosystem. Strukturen skapas direkt i Google Drive Workspace under fullständig behörighetskontroll.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <h3 className="text-xs font-bold text-emerald-400">2. Transparens genom WAL</h3>
                  <p className="text-xs text-slate-400">
                    Varje transaktion skrivs först till Write-Ahead Loggen som ett kryptografiskt länkat EventEnvelope. Full spårbarhet och deterministisk återhämtning vid omstart.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <h3 className="text-xs font-bold text-purple-400">3. Svärmintelligens</h3>
                  <p className="text-xs text-slate-400">
                    Fältanalytiker, Kommunikatör och Kvalitetsgranskare samverkar för att säkerställa att varje brev är genuint, värdeskapande och befriat från klyschor och spam.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <h3 className="text-xs font-bold text-amber-400">4. Öppna Gränssnitt via MCP</h3>
                  <p className="text-xs text-slate-400">
                    Genom Model Context Protocol (MCP) kan vilken extern AI-agent eller verktygsklient som helst docka in via standardiserade JSON-RPC 2.0-anrop.
                  </p>
                </div>
              </div>

              <p className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                Systemet är byggt enligt strikta arkitekturmönster (FSD, CloudEvents 1.0, Zod-kontrakt) för att garantera att dina processer körs stabilt, säkert och med absolut respekt för mottagarens tid.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Statusfot */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs text-slate-400 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Arkitekturstatus: GODKÄND (TCK-001)</span>
          </span>
          <span>WAL-poster: {walEntries.length}</span>
          <span>MCP-verktyg: {mcpTools.length}</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          CloudEvents 1.0 • Fail Fast Enabled • In-Memory OAuth Security
        </div>
      </footer>
    </div>
  );
}
