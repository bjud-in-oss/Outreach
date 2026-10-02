import React, { createContext, useContext, useRef, useMemo } from 'react';
import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { SwarmOrchestrator } from '../coordinator/swarmOrchestrator.ts';
import { GoogleDriveClient } from '../../google_drive_sync/api/driveClient.ts';

export interface SwarmCoreContextValue {
  eventBus: SwarmEventBus;
  orchestrator: SwarmOrchestrator;
  driveClient: GoogleDriveClient;
  liveSession: GeminiLiveSession;
}

const SwarmContext = createContext<SwarmCoreContextValue | null>(null);

export interface SwarmProviderProps {
  children: React.ReactNode;
  eventBus?: SwarmEventBus;
  session?: GeminiLiveSession;
  driveClient?: GoogleDriveClient;
  orchestrator?: SwarmOrchestrator;
}

export const SwarmProvider: React.FC<SwarmProviderProps> = ({
  children,
  eventBus: customBus,
  session: customSession,
  driveClient: customDrive,
  orchestrator: customOrchestrator,
}) => {
  const busRef = useRef<SwarmEventBus>(customBus || getGlobalSwarmEventBus());
  const sessionRef = useRef<GeminiLiveSession>(customSession || new GeminiLiveSession(undefined, busRef.current));
  const driveRef = useRef<GoogleDriveClient>(customDrive || new GoogleDriveClient());
  const orchestratorRef = useRef<SwarmOrchestrator>(
    customOrchestrator || new SwarmOrchestrator(sessionRef.current, undefined, busRef.current)
  );

  const value = useMemo<SwarmCoreContextValue>(() => ({
    eventBus: busRef.current,
    liveSession: sessionRef.current,
    driveClient: driveRef.current,
    orchestrator: orchestratorRef.current,
  }), []);

  return <SwarmContext.Provider value={value}>{children}</SwarmContext.Provider>;
};

export function useSwarmContext(): SwarmCoreContextValue {
  const ctx = useContext(SwarmContext);
  if (!ctx) {
    throw new Error('useSwarmContext must be used within a SwarmProvider');
  }
  return ctx;
}

export function useOptionalSwarmContext(): SwarmCoreContextValue | null {
  return useContext(SwarmContext);
}

