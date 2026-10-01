import { useState, useEffect, useRef, useCallback } from 'react';

export interface UserActivityLockReturn {
  isLocked: boolean;
  lockUntil: number;
  triggerActivity: () => void;
  canAutonomouslyUpdate: () => boolean;
}

export function useUserActivityLock(lockDurationMs = 5000): UserActivityLockReturn {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerActivity = useCallback(() => {
    const until = Date.now() + lockDurationMs;
    setLockUntil(until);
    setIsLocked(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsLocked(false);
      timerRef.current = null;
    }, lockDurationMs);
  }, [lockDurationMs]);

  const canAutonomouslyUpdate = useCallback(() => {
    return !isLocked && Date.now() >= lockUntil;
  }, [isLocked, lockUntil]);

  useEffect(() => {
    const handleActivity = () => {
      triggerActivity();
    };

    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [triggerActivity]);

  return {
    isLocked,
    lockUntil,
    triggerActivity,
    canAutonomouslyUpdate,
  };
}
