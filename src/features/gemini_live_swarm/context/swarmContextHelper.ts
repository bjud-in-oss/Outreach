import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { SwarmOrchestrator } from '../coordinator/swarmOrchestrator.ts';
import { GoogleDriveClient } from '../../google_drive_sync/api/driveClient.ts';
import { PendulumStore } from '../session/pendulumStore.ts';
import { WalUiTelemetryListener } from '../../wal_logger/walUiTelemetry.ts';

export interface SwarmProviderProps {
  children?: React.ReactNode;
  eventBus?: SwarmEventBus;
  session?: GeminiLiveSession;
  driveClient?: GoogleDriveClient;
  orchestrator?: SwarmOrchestrator;
  pendulumStore?: PendulumStore;
  walTelemetry?: WalUiTelemetryListener;
}

export interface SwarmCoreInstances {
  bus: SwarmEventBus;
  session: GeminiLiveSession;
  drive: GoogleDriveClient;
  orchestrator: SwarmOrchestrator;
  pendulum: PendulumStore;
  telemetry: WalUiTelemetryListener;
}

export function initSwarmCoreInstances(props: SwarmProviderProps): SwarmCoreInstances {
  const bus = props.eventBus || getGlobalSwarmEventBus();
  const session = props.session || new GeminiLiveSession(undefined, bus);
  const drive = props.driveClient || new GoogleDriveClient();
  const orchestrator = props.orchestrator || new SwarmOrchestrator(session, undefined, bus);
  const pendulum = props.pendulumStore || new PendulumStore(bus);
  const telemetry = props.walTelemetry || new WalUiTelemetryListener(bus);

  return {
    bus,
    session,
    drive,
    orchestrator,
    pendulum,
    telemetry,
  };
}
