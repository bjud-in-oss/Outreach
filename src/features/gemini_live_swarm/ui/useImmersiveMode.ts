import { useState, useRef, useEffect, useCallback } from 'react';

export interface ImmersiveModeReturn {
  isImmersive: boolean;
  overlayVisible: boolean;
  resetOverlayTimer: () => void;
  toggleImmersive: () => void;
}

export function useImmersiveMode(autoHideMs = 3000): ImmersiveModeReturn {
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetOverlayTimer = useCallback(() => {
    setOverlayVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, autoHideMs);
  }, [autoHideMs]);

  const toggleImmersive = useCallback(() => {
    setIsImmersive((prev) => !prev);
    resetOverlayTimer();
  }, [resetOverlayTimer]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return {
    isImmersive,
    overlayVisible,
    resetOverlayTimer,
    toggleImmersive,
  };
}
