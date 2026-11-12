import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiLiveSession } from '../session/geminiLiveSession';
import { SwarmEventBus } from '../bus/swarmEventBus';

describe('GeminiLiveSession - liveBridgeHelper integration TCK-052', () => {
  let eventBus: SwarmEventBus;
  let session: GeminiLiveSession;

  beforeEach(() => {
    eventBus = new SwarmEventBus();
    // Vi skickar med en dummy API-nyckel för att undvika HALTED utan att behöva mocka miljövariabler
    session = new GeminiLiveSession('test-api-key', eventBus);
  });

  it('bör automatiskt publicera a2ui händelser vid intent aktivering/inaktivering', () => {
    const capturedEvents: any[] = [];
    eventBus.subscribe('a2ui:render', (event) => capturedEvents.push({ type: 'a2ui:render', data: event }));
    eventBus.subscribe('a2ui:clear', (event) => capturedEvents.push({ type: 'a2ui:clear', data: event }));

    eventBus.publish('swarm.live.intent.activated', { data: { title: 'Att följa' } });
    
    expect(capturedEvents.length).toBe(1);
    expect(capturedEvents[0].type).toBe('a2ui:render');
    expect(capturedEvents[0].data.componentId).toBe('ListeningCard');

    eventBus.publish('swarm.live.intent.deactivated', {});

    expect(capturedEvents.length).toBe(2);
    expect(capturedEvents[1].type).toBe('a2ui:clear');
  });

  it('bör emittera swarm.session.text_delta när agenten skickar utskrift', () => {
    const deltaEvents: any[] = [];
    eventBus.subscribe('swarm.session.text_delta', (event) => deltaEvents.push(event));

    const msg = {
      serverContent: {
        outputTranscription: {
          text: 'Hej från rösten'
        }
      }
    };

    session.handleAgentMessage('forlikas', msg);

    expect(deltaEvents.length).toBe(1);
    expect(deltaEvents[0].text).toBe('Hej från rösten');
  });

  it('bör publicera a2ui:render när agenten anropar render_a2ui via toolCall', () => {
    const renderEvents: any[] = [];
    eventBus.subscribe('a2ui:render', (event) => renderEvents.push(event));

    // Vi behöver en mock för activeSdkSession för att verifiera sendToolResponse anropet
    let toolResponseCalled = false;
    (session as any).activeSdkSession = {
      sendToolResponse: () => { toolResponseCalled = true; }
    };

    const msg = {
      toolCall: {
        functionCalls: [
          {
            id: 'c1',
            name: 'render_a2ui',
            args: {
              componentId: 'ActionPrompt',
              dataModel: { actionLabel: 'Kör' }
            }
          }
        ]
      }
    };

    session.handleAgentMessage('forlikas', msg);

    expect(renderEvents.length).toBe(1);
    expect(renderEvents[0].componentId).toBe('ActionPrompt');
    expect(renderEvents[0].dataModel.actionLabel).toBe('Kör');
    expect(toolResponseCalled).toBe(true);
  });
});
