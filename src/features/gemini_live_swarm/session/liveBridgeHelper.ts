import { SwarmEventBus } from '../bus/swarmEventBus';
import { BidiRealtimeInputPayload } from './geminiLiveSession';

export const A2UI_TOOL_DECLARATIONS = [
  {
    name: 'render_a2ui',
    description: 'Render an A2UI component based on intent or state change',
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
    description: 'Clear the currently rendered A2UI component',
    parameters: {
      type: 'OBJECT',
      properties: {},
    }
  }
];

export const packBidiAudioChunk = (data: string, mimeType = 'audio/pcm;rate=16000'): BidiRealtimeInputPayload => {
  return { audio: { data, mimeType }, realtimeInput: { mediaChunks: [{ mimeType, data }] } };
};

export const bindLiveSwarmBridge = (
  bus: SwarmEventBus,
  getSession: () => any,
  isConnected: () => boolean,
  onDisconnect: () => void
) => {
  const audioSub = bus.subscribe('swarm.live.stream.audio', (env) => {
    const data = (env.data as any)?.data || (env.data as any)?.audioChunkBase64;
    if (!isConnected() || !data) return;
    const session = getSession();
    if (session?.sendRealtimeInput) {
      session.sendRealtimeInput(packBidiAudioChunk(data));
    }
  });

  const intentActivatedSub = bus.subscribe('swarm.live.intent.activated', (env) => {
    const payload = env.data as any;
    bus.emit('a2ui:render', {
      componentId: 'ListeningCard',
      dataModel: { intent: payload?.title || 'Lyssnar aktivt' }
    });
  });

  const intentDeactivatedSub = bus.subscribe('swarm.live.intent.deactivated', () => {
    bus.emit('a2ui:clear', {});
  });

  return () => {
    audioSub.unsubscribe();
    intentActivatedSub.unsubscribe();
    intentDeactivatedSub.unsubscribe();
  };
};

export const handleLiveToolCalls = (
  functionCalls: any[],
  bus: SwarmEventBus,
  sendToolResponse: (responses: any[]) => void
) => {
  const responses: any[] = [];
  
  for (const call of functionCalls) {
    if (call.name === 'render_a2ui') {
      try {
        const args = typeof call.args === 'string' ? JSON.parse(call.args) : call.args;
        bus.emit('a2ui:render', args);
        responses.push({
          id: call.id,
          name: 'render_a2ui',
          response: { ok: true }
        });
      } catch (err) {
        responses.push({
          id: call.id,
          name: 'render_a2ui',
          response: { ok: false, error: 'Invalid arguments' }
        });
      }
    } else if (call.name === 'clear_a2ui') {
      bus.emit('a2ui:clear', {});
      responses.push({
        id: call.id,
        name: 'clear_a2ui',
        response: { ok: true }
      });
    }
  }

  if (responses.length > 0) {
    sendToolResponse(responses);
  }
};

export const processLiveServerTranscripts = (message: any, bus: SwarmEventBus) => {
  const parts = message?.serverContent?.modelTurn?.parts || [];
  for (const part of parts) {
    if (part.text) {
      bus.emit('swarm.session.text_delta', {
        sourceRole: 'assistant',
        agentRole: 'Live Agent',
        text: part.text,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  const outputTranscription = message?.serverContent?.outputTranscription?.text;
  if (outputTranscription) {
    bus.emit('swarm.session.text_delta', {
      sourceRole: 'assistant',
      agentRole: 'Live Agent',
      text: outputTranscription,
      timestamp: new Date().toISOString()
    });
  }
};
