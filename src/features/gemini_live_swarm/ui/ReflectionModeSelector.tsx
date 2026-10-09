import React, { useState } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import {
  ReflectionMode,
  ReflectionModeOption,
  ReflectionModeSchema,
  REFLECTION_MODES,
  REFLECTION_MODE_EVENT,
  getReflectionModeStyle,
} from './reflectionStateHelper.ts';

export interface ReflectionModeSelectorProps {
  bus?: SwarmEventBus;
  defaultMode?: ReflectionMode;
  onModeChange?: (mode: ReflectionMode) => void;
  className?: string;
}

const renderModeButton = (
  item: ReflectionModeOption,
  activeMode: ReflectionMode,
  onSelect: (mode: ReflectionMode) => void
) => {
  const btnStyle = getReflectionModeStyle(item.id, activeMode);
  return (
    <button
      key={item.id}
      type="button"
      data-testid={`reflection-mode-${item.id}`}
      title={item.description}
      onClick={() => onSelect(item.id)}
      className={`px-3 py-1.5 min-h-[38px] text-xs font-mono rounded border transition-colors flex items-center justify-center ${btnStyle}`}
    >
      {item.label}
    </button>
  );
};

export const ReflectionModeSelector: React.FC<ReflectionModeSelectorProps> = ({
  bus,
  defaultMode = 'normal',
  onModeChange,
  className = '',
}) => {
  const [activeMode, setActiveMode] = useState<ReflectionMode>(defaultMode);

  const handleSelect = (mode: ReflectionMode) => {
    const validated = ReflectionModeSchema.parse(mode);
    setActiveMode(validated);
    const activeBus = bus || getGlobalSwarmEventBus();
    activeBus.emit(REFLECTION_MODE_EVENT, { mode: validated, timestamp: new Date().toISOString() });
    if (onModeChange) onModeChange(validated);
  };

  return (
    <nav
      data-testid="reflection-mode-selector"
      aria-label="Reflektionsdjup"
      className={`inline-flex items-center gap-1 p-1 bg-slate-900/95 border border-slate-800 rounded-lg shadow-md backdrop-blur-sm select-none ${className}`}
    >
      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 font-bold hidden sm:inline">
        Reflektion:
      </span>
      {REFLECTION_MODES.map((item) => renderModeButton(item, activeMode, handleSelect))}
    </nav>
  );
};
