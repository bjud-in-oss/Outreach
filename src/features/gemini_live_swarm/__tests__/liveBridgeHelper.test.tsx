import { describe, it, expect } from 'vitest';
import { SwarmEventBus } from '../bus/swarmEventBus';
import { GeminiLiveSession } from '../session/geminiLiveSession';
import { 
  packBidiAudioChunk, 
  bindLiveSwarmBridge, 
  handleLiveToolCalls 
} from '../session/liveBridgeHelper';

describe('TCK-051 Transient Test Suite', () => {

  it('should pack the audio chunk in the correct Bidi format', () => {
    const rawData = 'base64data';
    const packet = packBidiAudioChunk(rawData);
    
    expect(packet).toEqual({
      audio: {
        data: rawData,
        mimeType: 'audio/pcm;rate=16000'
      }
    });
  });

  it('should bind the swarm bridge and react to intent events', () => {
    const bus = new SwarmEventBus();
    let sentInput: any = null;
    const mockSdkSession = {
      sendRealtimeInput: (data: any) => { sentInput = data; }
    };
    
    let isConnected = true;
    const getSession = () => mockSdkSession;
    const checkConnected = () => isConnected;
    const onDisconnect = () => { isConnected = false; };
    
    bindLiveSwarmBridge(bus, getSession, checkConnected, onDisconnect);
    
    const capturedUiEvents: any[] = [];
    bus.subscribe('a2ui:render', (payload) => {
      capturedUiEvents.push(payload);
    });
    
    bus.publish('swarm.live.intent.activated', { intent: 'CONSULT' });

    expect(capturedUiEvents.length).toBe(1);
    expect(capturedUiEvents[0]).toEqual({
      componentId: 'ListeningCard',
      dataModel: { intent: 'Att förlikas' }
    });
  });

  it('should process live tool calls and send responses back through the bus', () => {
    const bus = new SwarmEventBus();
    const capturedResponses: any[] = [];
    
    const sendToolResponse = (responses: any[]) => {
      capturedResponses.push(...responses);
    };
    
    const functionCalls = [
      {
        id: 'call-1',
        name: 'render_a2ui',
        args: { componentId: 'TestCard', dataModel: {} }
      }
    ];

    handleLiveToolCalls(functionCalls, bus, sendToolResponse);
    
    expect(capturedResponses.length).toBe(1);
    expect(capturedResponses[0]).toEqual({
      id: 'call-1',
      name: 'render_a2ui',
      response: { ok: true }
    });
  });

  it('should initialize a GeminiLiveSession without production mocks', () => {
    const bus = new SwarmEventBus();
    const session = new GeminiLiveSession('test-api-key', bus);
    
    expect(session).toBeDefined();
    expect(session.isLiveConnected()).toBe(false);
  });
});
