import React from 'react';

export interface TouchOverlayMenuProps {
  isVisible: boolean;
  onTriggerReflect?: () => void;
  onTriggerRemember?: () => void;
  onTriggerConsult?: () => void;
  onToggleImmersive?: () => void;
  isImmersive?: boolean;
  className?: string;
}

const NOOP = () => {};

export const TouchOverlayMenu: React.FC<TouchOverlayMenuProps> = ({
  isVisible,
  onTriggerReflect = NOOP,
  onTriggerRemember = NOOP,
  onTriggerConsult = NOOP,
  onToggleImmersive = NOOP,
  isImmersive = false,
  className = '',
}) => {
  const visibilityClass = isVisible
    ? 'opacity-100 pointer-events-auto translate-y-0'
    : 'opacity-0 pointer-events-none translate-y-2';
  const immersiveIcon = isImmersive ? '⇲' : '⛶';

  return (
    <nav data-testid="touch-overlay-menu" className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visibilityClass} ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs font-medium">
        <button type="button" data-testid="trigger-reflect" onClick={onTriggerReflect} className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">🎬 Reflektera</button>
        <button type="button" data-testid="trigger-remember" onClick={onTriggerRemember} className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors">🧠 Kom ihåg</button>
        <button type="button" data-testid="trigger-consult" onClick={onTriggerConsult} className="px-2.5 py-1 rounded-full bg-emerald-600/80 hover:bg-emerald-600 text-white transition-colors">💬 Rådgör</button>
        <button type="button" data-testid="toggle-immersive-btn" onClick={onToggleImmersive} className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">{immersiveIcon}</button>
      </div>
    </nav>
  );
};
