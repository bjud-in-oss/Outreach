import { SwarmEventBus } from '../bus/swarmEventBus';

export const A2UI_TOOL_DECLARATIONS = [
  {
    name: 'render_a2ui',
    description: 'Render a UI component',
    parameters: {
      type: 'OBJECT',
      properties: {
        componentId: { type: 'STRING' },
        dataModel: { type: 'OBJECT' }
      },
      required: ['componentId', 'dataModel']
    }
  },
  {
    name: 'clear_a2ui',
    description: 'Clear the rendered UI component',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  }
];

export function packBidiAudioChunk(data: string, mimeType = 'audio/pcm;rate=16000') {
  return {
    audio: {
      data,
      mimeType
    }
  };
}

export function bindLiveSwarmBridge(
  bus: SwarmEventBus,
  getSession: () => any,
  isConnected: () => boolean,
  onDisconnect: () => void
) {
  bus.subscribe('swarm.live.stream.audio', (env) => {
    const chunk = (env.data as any)?.audioChunkBase64 || (env.data as any)?.data;
    const mimeType = (env.data as any)?.mimeType || 'audio/pcm;rate=16000';
    if (!isConnected() || !chunk) return;
    const payload = packBidiAudioChunk(chunk, mimeType);
    try {
      const session = getSession();
      if (session?.sendRealtimeInput) {
        session.sendRealtimeInput(payload);
      }
    } catch (e: any) {
      onDisconnect();
      bus.publishLiveEvent('swarm.live.session.error', { error: `Audio stream error: ${e?.message || String(e)}` });
    }
  });

  bus.subscribe('swarm.live.intent.activated', (env) => {
    bus.publish('a2ui:render', {
      componentId: 'ListeningCard',
      dataModel: { intent: 'Att förlikas' }
    });
  });

  bus.subscribe('swarm.live.intent.deactivated', (env) => {
    bus.publish('a2ui:clear', {});
  });
}

export function handleLiveToolCalls(
  functionCalls: any[],
  bus: SwarmEventBus,
  sendToolResponse: (responses: any[]) => void
) {
  const responses: any[] = [];
  for (const call of functionCalls) {
    if (call.name === 'render_a2ui') {
      bus.publish('a2ui:render', call.args);
      responses.push({
        id: call.id,
        name: call.name,
        response: { ok: true }
      });
    } else if (call.name === 'clear_a2ui') {
      bus.publish('a2ui:clear', {});
      responses.push({
        id: call.id,
        name: call.name,
        response: { ok: true }
      });
    }
  }
  if (responses.length > 0) {
    sendToolResponse(responses);
  }
}

export function processLiveServerTranscripts(message: any, bus: SwarmEventBus) {
  const text = message?.outputTranscription?.text || message?.inputTranscription?.text;
  if (text) {
    bus.emit('swarm.session.text_delta', {
      sourceRole: 'assistant',
      agentRole: 'Att förlikas',
      text,
      timestamp: new Date().toISOString()
    });
  }
}
