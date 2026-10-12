import React from 'react';
import { useOptionalSwarmContext } from '../context/SwarmContext.tsx';
import { REFLECTION_MODES, usePromptBarState } from './promptBarHelper.ts';

export interface UnifiedPromptBarProps {
  onSendMessage?: (text: string) => void;
  className?: string;
}

export const UnifiedPromptBar: React.FC<UnifiedPromptBarProps> = ({ onSendMessage, className = '' }) => {
  const swarmCtx = useOptionalSwarmContext();
  const bar = usePromptBarState(swarmCtx, onSendMessage);

  return (
<div data-testid="unified-prompt-bar" className={`flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-lg w-full max-w-4xl mx-auto ${className}`}>
  <select
    data-testid="reflection-dropdown"
    value={bar.reflectionMode}
    onChange={(e) => bar.handleModeChange(e.target.value)}
    className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1.5 font-mono cursor-pointer outline-none hover:bg-slate-700 transition-colors"
  >
    {REFLECTION_MODES.map((m) => (
      <option key={m.id} value={m.id}>{m.label}</option>
    ))}
  </select>

  <button
    type="button"
    data-testid="stt-mic-button"
    title="Speech-to-Text diktering"
    onClick={bar.handleSTTToggle}
    className={`p-2 rounded text-xs transition-colors flex items-center justify-center ${bar.sttClass}`}
  >
    🎤
  </button>

  <button
    type="button"
    data-testid="start-pause-button"
    onClick={bar.handleLiveToggle}
    className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm ${bar.liveProps.bgClass}`}
  >
    <span>{bar.liveProps.icon}</span>
    <span>{bar.liveProps.label}</span>
  </button>

  <input
    type="text"
    data-testid="prompt-input"
    placeholder="Skriv meddelande eller tala med agenten..."
    value={bar.inputText}
    onChange={(e) => bar.setInputText(e.target.value)}
    onKeyDown={(e) => { if (e.key === 'Enter') bar.handleSend(); }}
    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
  />

  <button
    type="button"
    data-testid="send-prompt-button"
    onClick={bar.handleSend}
    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-bold transition-colors"
  >
    Skicka
  </button>
</div>
  );
};
