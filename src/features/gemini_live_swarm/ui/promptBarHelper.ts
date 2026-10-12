import { useState, useEffect, useRef } from 'react';
import { ReflectionMode, REFLECTION_MODES, parseReflectionMode, REFLECTION_MODE_EVENT } from './reflectionStateHelper.ts';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';

export { REFLECTION_MODES };
export type { ReflectionMode };

export function getLiveButtonProps(isConnected: boolean, isPaused: boolean): { label: string; icon: string; bgClass: string } {
  if (!isConnected) {
    return { label: 'Starta Live', icon: '🎙️', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
  }
  if (isPaused) {
    return { label: 'Start', icon: '▶️', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
  }
  return { label: 'Aktiv/Paus', icon: '⏸️', bgClass: 'bg-amber-600 hover:bg-amber-500 text-white' };
}

export function handleModeSelect(modeVal: string, bus?: SwarmEventBus | null, onModeChange?: (mode: ReflectionMode) => void): ReflectionMode {
  const mode = parseReflectionMode(modeVal);
  if (bus) {
    bus.emit(REFLECTION_MODE_EVENT, { mode, timestamp: new Date().toISOString() });
  }
  if (onModeChange) onModeChange(mode);
  return mode;
}

export function createSTTRecognizer(
  onTranscript: (text: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void } | null {
  if (typeof window === 'undefined') return null;
  const Win = window as any;
  const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  try {
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'sv-SE';
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      if (text) onTranscript(text);
    };
    rec.onend = onEnd;
    rec.onerror = onEnd;
    return {
      start: () => { try { rec.start(); } catch {} },
      stop: () => { try { rec.stop(); } catch {} },
    };
  } catch {
    return null;
  }
}

export function usePromptBarState(swarmCtx: any, onSendMessage?: (text: string) => void) {
  const [inputText, setInputText] = useState('');
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>('normal');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSTTActive, setIsSTTActive] = useState(false);
  const sttRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    return swarmCtx?.eventBus.subscribe('*', (env: any) => {
      if (env.type === 'swarm.live.session.connected') setIsLiveActive(true);
      if (env.type === 'swarm.live.session.disconnected') setIsLiveActive(false);
      if (env.type === 'swarm.session.paused') setIsPaused(true);
      if (env.type === 'swarm.session.resumed') setIsPaused(false);
    });
  }, [swarmCtx]);

  const handleLiveToggle = async () => {
    if (!swarmCtx?.liveSession) return;
    if (!isLiveActive) {
      await swarmCtx.liveSession.activateIntent('forlikas');
      setIsLiveActive(true);
    } else {
      const next = swarmCtx.liveSession.togglePause();
      setIsPaused(next);
    }
  };

  const handleSTTToggle = () => {
    if (!sttRef.current) {
      sttRef.current = createSTTRecognizer(
        (word) => setInputText((prev) => (prev ? `${prev} ${word}` : word)),
        () => setIsSTTActive(false)
      );
    }
    const next = !isSTTActive;
    setIsSTTActive(next);
    if (next) sttRef.current?.start();
    else sttRef.current?.stop();
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    swarmCtx?.liveSession?.sendRealtimeText(text);
    if (onSendMessage) onSendMessage(text);
    setInputText('');
  };

  const handleModeChange = (modeVal: string) => {
    const mode = handleModeSelect(modeVal, swarmCtx?.eventBus);
    setReflectionMode(mode);
  };

  const liveProps = getLiveButtonProps(isLiveActive, isPaused);
  const sttClass = isSTTActive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-slate-300';

  return {
    inputText,
    setInputText,
    reflectionMode,
    handleModeChange,
    handleLiveToggle,
    handleSTTToggle,
    handleSend,
    liveProps,
    sttClass,
  };
}
