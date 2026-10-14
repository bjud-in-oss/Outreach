import React, { createContext, useContext, useRef, useMemo, useEffect } from 'react';
import { SwarmEventBus } from '../bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { SwarmOrchestrator } from '../coordinator/swarmOrchestrator.ts';
import { GoogleDriveClient } from '../../google_drive_sync/api/driveClient.ts';
import { PendulumStore } from '../session/pendulumStore.ts';
import { WalUiTelemetryListener } from '../../wal_logger/walUiTelemetry.ts';
import {
  SwarmProviderProps,
  initSwarmCoreInstances,
} from './swarmContextHelper.ts';

export type { SwarmProviderProps };

export interface SwarmCoreContextValue {
  eventBus: SwarmEventBus;
  orchestrator: SwarmOrchestrator;
  driveClient: GoogleDriveClient;
  liveSession: GeminiLiveSession;
  pendulumStore: PendulumStore;
  walTelemetry: WalUiTelemetryListener;
}

const SwarmContext = createContext<SwarmCoreContextValue | null>(null);

export const SwarmProvider: React.FC<SwarmProviderProps> = (props) => {
  const instancesRef = useRef(initSwarmCoreInstances(props));
  const { bus, session, drive, orchestrator, pendulum, telemetry } = instancesRef.current;

  useEffect(() => {
    return () => {
      pendulum.dispose();
      telemetry.dispose();
    };
  }, [pendulum, telemetry]);

  const value = useMemo<SwarmCoreContextValue>(() => ({
    eventBus: bus,
    liveSession: session,
    driveClient: drive,
    orchestrator,
    pendulumStore: pendulum,
    walTelemetry: telemetry,
  }), [bus, session, drive, orchestrator, pendulum, telemetry]);

  return <SwarmContext.Provider value={value}>{props.children}</SwarmContext.Provider>;
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
