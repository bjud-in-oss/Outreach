import React, { useState } from 'react';
import { Volume2, VolumeX, Radio, Send, Play } from 'lucide-react';
import { AudioOutputState } from '../../telemetry/telemetrySchema.ts';

interface SwarmControlPanelProps {
  audioOutput?: AudioOutputState;
  onToggleMute: () => void;
  onSendVoiceVerb: (verb: string) => void;
  onExecuteWork: () => void;
  isExecuting?: boolean;
}

export const SwarmControlPanel: React.FC<SwarmControlPanelProps> = ({
  audioOutput,
  onToggleMute,
  onSendVoiceVerb,
  onExecuteWork,
  isExecuting = false,
}) => {
  const [manualInput, setManualInput] = useState('');
  const isMuted = audioOutput?.isMuted ?? true;
  const statusText = isMuted
    ? 'Tyst röstspärr aktiv: total arbetsro under flerstegskörning.'
    : 'Högtalarkanal öppen för aktiv talare.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onSendVoiceVerb(manualInput.trim());
    setManualInput('');
  };

  const statusHeader = (
    <div className="flex items-center space-x-2">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Live API-Brygga & Röstspärr</span>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">gemini-3.8-live</span>
    </div>
  );

  const statusSection = (
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
        <Radio className="w-5 h-5 animate-pulse" />
      </div>
      <div>
        {statusHeader}
        <p className="text-[11px] text-slate-400 mt-0.5">{statusText}</p>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex items-center space-x-2">
      <button onClick={onToggleMute} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border cursor-pointer ${isMuted ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'}`}>
        {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span>{isMuted ? 'Öppna röstkanal' : 'Tysta röstspärr'}</span>
      </button>
      <button onClick={onExecuteWork} disabled={isExecuting} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer">
        <Play className="w-3.5 h-3.5" />
        <span>{isExecuting ? 'Kör...' : 'Starta körning'}</span>
      </button>
    </div>
  );

  const inputForm = (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
      <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Tala eller skriv verbanrop (följa, vända, förlika, bygga)..." className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60" />
      <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-1 cursor-pointer">
        <Send className="w-3 h-3" /> <span>Sänd</span>
      </button>
    </form>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {statusSection}
        {actionButtons}
      </div>
      {inputForm}
    </div>
  );
};
