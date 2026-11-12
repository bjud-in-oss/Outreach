import { describe, it, expect } from 'vitest';
import { SwarmEventBus } from '../bus/swarmEventBus';
import { GeminiLiveSession } from '../session/geminiLiveSession';
import { SessionIntentManager } from '../session/sessionIntentAudio';

describe('TCK-053 Explicit VAD-slutsignal (audioStreamEnd) och Röstlatens', () => {
    it('ska emittera swarm.live.stream.audio_end och mäta röstlatens', async () => {
        const eventBus = new SwarmEventBus();
        
        let audioEndEmitted = false;
        let audioStreamEndSent = false;
        let voiceLatencyEmitted = false;
        let capturedLatency = -1;

        eventBus.subscribe('swarm.live.stream.audio_end', () => {
            audioEndEmitted = true;
        });

        eventBus.subscribe('telemetry:voice_latency', (payload) => {
            voiceLatencyEmitted = true;
            capturedLatency = payload.vadToFirstByteMs;
            audioStreamEndSent = payload.audioEndSent;
        });

        // Skapa session och mocka activeSdkSession
        const session = new GeminiLiveSession('test-api-key', eventBus);
        const mockSdkSession = {
            sendRealtimeInput: (input: { audioStreamEnd?: boolean }) => {
                if (input.audioStreamEnd) {
                    audioStreamEndSent = true;
                }
            }
        };
        (session as any).activeSdkSession = mockSdkSession;
        (session as any).liveStatus = 'STREAMING';

        // Skapa SessionIntentManager
        const intentManager = new SessionIntentManager(eventBus);

        // Simulera tal-chunk
        intentManager.processIncomingChunk({ text: 'Hej' }, 1000);
        
        // Vänta ut postRollMs (> 500ms) genom att simulera tid med tystnad
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Triggar VAD slutsignal via tystnad eller ny process
        intentManager.processIncomingChunk({ text: '' }, 0); 

        // Verifiera att swarm.live.stream.audio_end emitterades och audioStreamEnd skickades
        expect(audioEndEmitted).toBe(true);
        expect(audioStreamEndSent).toBe(true);

        // Simulera att agenten svarar
        session.handleAgentMessage('forlikas', { 
            serverContent: { 
                outputTranscription: { text: 'Svar' } 
            } 
        });

        // Verifiera telemetry:voice_latency och att latens är numerisk
        expect(voiceLatencyEmitted).toBe(true);
        expect(capturedLatency).toBeGreaterThanOrEqual(0);
    });
});
