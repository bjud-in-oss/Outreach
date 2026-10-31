import { useState, useEffect, useRef } from 'react';
import { ReflectionMode, REFLECTION_MODES, parseReflectionMode, REFLECTION_MODE_EVENT } from './reflectionStateHelper.ts';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';

export { REFLECTION_MODES };
export type { ReflectionMode };

export function formatMemoryIndicator(usageRatio?: number): string {
  if (usageRatio === undefined) return '[Ledigt --%]';
  const freePercentage = Math.round((1 - Math.min(Math.max(usageRatio, 0), 1)) * 100);
  return `[Ledigt ${freePercentage}%]`;
}

export function getMicButtonProps(isLiveActive: boolean, isMuted: boolean, isSTTActive: boolean, isDebounced: boolean) {
  if (isDebounced) return { title: 'Låst (debounce)', bgClass: 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed' };
  if (isSTTActive) return { title: 'STT Aktiv', bgClass: 'bg-red-600 text-white animate-pulse' };
  if (isLiveActive && !isMuted) return { title: 'Mikrofon Aktiv', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
  if (isLiveActive && isMuted) return { title: 'Muted (Zoom-läge)', bgClass: 'bg-amber-600 hover:bg-amber-500 text-white' };
  return { title: 'Starta Mikrofon', bgClass: 'bg-slate-800 hover:bg-slate-700 text-slate-300' };
}

export function getLiveButtonProps(isConnected: boolean, isPaused: boolean) {
  if (!isConnected) return { label: 'Starta Live', icon: '🎙️', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
  if (isPaused) return { label: 'Start', icon: '▶️', bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
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
      start: () => { try { rec.start(); } catch (e) { void e; } },
      stop: () => { try { rec.stop(); } catch (e) { void e; } },
    };
  } catch (e) {
    void e;
    return null;
  }
}

export function initDictationRecognizer(
  setInputText: (fn: (prev: string) => string) => void,
  bus?: SwarmEventBus | null,
  onEnd?: () => void
) {
  return createSTTRecognizer((w) => {
    setInputText((prev) => (prev ? `${prev} ${w}` : w));
    bus?.emit('swarm.session.text_delta', {
      sourceRole: 'user', text: w, isLocalSTT: true, timestamp: new Date().toISOString(),
    });
  }, onEnd || (() => {}));
}

export function usePromptBarState(swarmCtx: any, onSendMessage?: (text: string) => void) {
  const [inputText, setInputText] = useState('');
  const [reflectionMode, setReflectionMode] = useState<ReflectionMode>('normal');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [wasLiveUnmutedBeforeFocus, setWasLiveUnmutedBeforeFocus] = useState(false);
  const [isTogglingMutex, setIsTogglingMutex] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [usageRatio, setUsageRatio] = useState<number | undefined>(undefined);

  const sttRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const wasUnmutedRef = useRef(false);
  const isTogglingRef = useRef(false);

  useEffect(() => {
    const subs = [
      swarmCtx?.eventBus.subscribe('swarm.live.session.connected', () => {
        setIsLiveActive(true);
        setIsMuted(false);
      }),
      swarmCtx?.eventBus.subscribe('swarm.live.session.disconnected', () => {
        setIsLiveActive(false);
        setIsMuted(false);
      }),
      swarmCtx?.eventBus.subscribe('MUTEX_TOGGLED', (data: any) => {
        if (data?.mode === 'MUTED') setIsMuted(true);
        if (data?.mode === 'LIVE_ACTIVE') setIsMuted(false);
      }),
      swarmCtx?.eventBus.subscribe('telemetry:usage', (data: any) => {
        setUsageRatio(data?.usageRatio);
      }),
    ];
    return () => subs.forEach((s: any) => s?.unsubscribe());
  }, [swarmCtx]);

  const handleFocus = () => {
    setIsTextareaFocused(true);
    const wasUnmuted = isLiveActive && !isMuted;
    wasUnmutedRef.current = wasUnmuted;
    setWasLiveUnmutedBeforeFocus(wasUnmuted);
    if (swarmCtx?.liveSession?.setVadPaused) {
      swarmCtx.liveSession.setVadPaused(true);
    }
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { focus: 'textarea', vad_paused: true });
  };

  const handleBlur = () => {
    setIsTextareaFocused(false);
    const shouldResume = wasUnmutedRef.current;
    if (swarmCtx?.liveSession?.setVadPaused && shouldResume) {
      swarmCtx.liveSession.setVadPaused(false);
    }
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', {
      focus: 'blurred',
      vad_paused: !shouldResume,
      resumed_vad: shouldResume,
    });
  };

  const handleMicToggle = async () => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    setIsTogglingMutex(true);
    setTimeout(() => {
      isTogglingRef.current = false;
      setIsTogglingMutex(false);
    }, 150);

    if (isTextareaFocused) {
      const nextStt = !isSTTActive;
      setIsSTTActive(nextStt);
      if (!sttRef.current) {
        sttRef.current = initDictationRecognizer(setInputText, swarmCtx?.eventBus, () => setIsSTTActive(false));
      }
      if (nextStt) sttRef.current?.start();
      else sttRef.current?.stop();
      swarmCtx?.eventBus?.emit('MUTEX_TOGGLED', { mode: 'STT_DICTATION' });
      swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { mode: 'STT_DICTATION', isSTTActive: nextStt });
      return;
    }

    if (!isLiveActive) {
      if (swarmCtx?.liveSession) {
        await swarmCtx.liveSession.activateIntent('CONSULT');
        swarmCtx.liveSession.setMicMuted?.(false);
      }
      setIsLiveActive(true);
      setIsMuted(false);
      swarmCtx?.eventBus?.emit('MUTEX_TOGGLED', { mode: 'LIVE_ACTIVE' });
      swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { mic: 'UNMUTED' });
      return;
    }

    if (!isMuted) {
      swarmCtx?.liveSession?.setMicMuted?.(true);
      setIsMuted(true);
      swarmCtx?.eventBus?.emit('MUTEX_TOGGLED', { mode: 'MUTED' });
      swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { mic: 'MUTED' });
    } else {
      swarmCtx?.liveSession?.setMicMuted?.(false);
      setIsMuted(false);
      swarmCtx?.eventBus?.emit('MUTEX_TOGGLED', { mode: 'LIVE_ACTIVE' });
      swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { mic: 'UNMUTED' });
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    swarmCtx?.eventBus?.emit('USER_COMMIT', { clientMessageId, text, timestamp: new Date().toISOString() });
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { textarea: 'cleared', clientMessageId });
    if (swarmCtx?.liveSession) {
      swarmCtx.liveSession.sendRealtimeText(text, undefined, clientMessageId);
    }
    if (onSendMessage) onSendMessage(text);
    setInputText('');
    swarmCtx?.eventBus?.emit('SWARM_TRANSCRIPT_MATCH', { clientMessageId, timestamp: new Date().toISOString() });
  };

  const handleModeChange = (modeVal: string) => {
    const mode = handleModeSelect(modeVal, swarmCtx?.eventBus);
    setReflectionMode(mode);
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { element: 'reflection_dropdown', mode: mode.toUpperCase() });
    swarmCtx?.eventBus?.emit('SESSION_CONFIG_UPDATED', {
      mode, thinkingConfig: { thinkingLevel: mode === 'mikro' ? 'low' : 'high' },
    });
  };

  const handleToolsToggle = () => {
    const next = !isToolsExpanded;
    setIsToolsExpanded(next);
    swarmCtx?.eventBus?.emit('UI_STATE_CHANGED', { element: 'action_history', expanded: next });
  };

  const micProps = getMicButtonProps(isLiveActive, isMuted, isSTTActive, isTogglingMutex);

  return {
    inputText,
    setInputText,
    reflectionMode,
    isLiveActive,
    isMuted,
    isSTTActive,
    isTextareaFocused,
    wasLiveUnmutedBeforeFocus,
    isTogglingMutex,
    isToolsExpanded,
    usageRatio,
    micProps,
    handleFocus,
    handleBlur,
    handleMicToggle,
    handleSend,
    handleModeChange,
    handleToolsToggle,
  };
}
