import { SwarmEventBus, getGlobalSwarmEventBus } from '../bus/swarmEventBus.ts';
import { GeminiLiveSession } from '../session/geminiLiveSession.ts';
import { SwarmOrchestrator } from '../coordinator/swarmOrchestrator.ts';
import { PendulumStore } from '../session/pendulumStore.ts';
import {
  IMcpDriveClient,
  ISwarmWalTelemetry,
} from '../../../shared/contracts/mcpToolContracts.ts';

export interface SwarmProviderProps {
  children?: React.ReactNode;
  eventBus?: SwarmEventBus;
  session?: GeminiLiveSession;
  driveClient?: IMcpDriveClient;
  orchestrator?: SwarmOrchestrator;
  pendulumStore?: PendulumStore;
  walTelemetry?: ISwarmWalTelemetry;
}

export interface SwarmCoreInstances {
  bus: SwarmEventBus;
  session: GeminiLiveSession;
  drive: IMcpDriveClient;
  orchestrator: SwarmOrchestrator;
  pendulum: PendulumStore;
  telemetry: ISwarmWalTelemetry;
}

const fallbackDriveClient: IMcpDriveClient = {
  uploadFileMultipart: async (opts) => ({
    id: `sim-drive-${Date.now()}`,
    name: opts.name,
  }),
};

const fallbackWalTelemetry: ISwarmWalTelemetry = {
  dispose: () => {},
};

export function initSwarmCoreInstances(props: SwarmProviderProps): SwarmCoreInstances {
  const bus = props.eventBus || getGlobalSwarmEventBus();
  const session = props.session || new GeminiLiveSession(undefined, bus);
  const drive = props.driveClient || fallbackDriveClient;
  const orchestrator = props.orchestrator || new SwarmOrchestrator(session, undefined, bus);
  const pendulum = props.pendulumStore || new PendulumStore(bus);
  const telemetry = props.walTelemetry || fallbackWalTelemetry;

  return {
    bus,
    session,
    drive,
    orchestrator,
    pendulum,
    telemetry,
  };
}
