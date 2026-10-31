import React from 'react';
import { Plus, Mic, Send } from 'lucide-react';
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
<div data-testid="unified-prompt-bar" className={`flex flex-col gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg w-full max-w-4xl mx-auto ${className}`}>
  <textarea
    data-testid="prompt-textarea"
    rows={2}
    placeholder="Skriv meddelande eller tala med agenten..."
    value={bar.inputText}
    onChange={(e) => bar.setInputText(e.target.value)}
    onFocus={bar.handleFocus}
    onBlur={bar.handleBlur}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        bar.handleSend();
      }
    }}
    className="w-full max-h-24 overflow-y-auto bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono resize-none leading-relaxed"
  />

  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        data-testid="action-history-plus-button"
        title="Verktygspanel och Action History"
        onClick={bar.handleToolsToggle}
        className="p-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
      >
        <Plus size={14} />
      </button>

      <select
        data-testid="reflection-dropdown"
        value={bar.reflectionMode}
        onChange={(e) => bar.handleModeChange(e.target.value)}
        className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-1 font-mono cursor-pointer outline-none hover:bg-slate-700 transition-colors"
      >
        {REFLECTION_MODES.map((m) => (
        <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>

    <div className="flex items-center gap-1.5">
      <button
        type="button"
        data-testid="mic-mutex-button"
        title={bar.micProps.title}
        disabled={bar.isTogglingMutex}
        onClick={bar.handleMicToggle}
        className={`p-1.5 rounded text-xs flex items-center justify-center transition-colors ${bar.micProps.bgClass}`}
      >
        <Mic size={14} />
      </button>

      <button
        type="button"
        data-testid="send-prompt-button"
        title="Skicka"
        onClick={bar.handleSend}
        className="p-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs transition-colors flex items-center justify-center"
      >
        <Send size={14} />
      </button>
    </div>
  </div>
</div>
  );
};
