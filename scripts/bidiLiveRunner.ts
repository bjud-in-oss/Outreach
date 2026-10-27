import { GoogleGenAI } from '@google/genai';

export interface BidiRunnerConfig {
  ai: GoogleGenAI;
  model: string;
  systemInstruction: string;
  tools?: any[];
  executeTool?: (name: string, args: any) => string;
}

export class BidiLiveSession {
  private session: any = null;
  private currentResolver: ((text: string) => void) | null = null;
  private currentRejecter: ((err: any) => void) | null = null;
  private accumulatedText = '';

  constructor(private config: BidiRunnerConfig) {}

  async connect(): Promise<void> {
    if (this.session) return;

    process.stdout.write('   📡 Ansluter Bidi Live WebSocket...');
    const connectConfig: any = {
      responseModalities: ['audio'],
      outputAudioTranscription: {},
      thinkingConfig: { thinkingLevel: 'low' },
      systemInstruction: {
        parts: [{ text: this.config.systemInstruction }],
      },
    };
    if (this.config.tools && this.config.tools.length > 0) {
      connectConfig.tools = [{ functionDeclarations: this.config.tools }];
    }

    this.session = await (this.config.ai as any).live.connect({
      model: this.config.model,
      config: connectConfig,
      callbacks: {
        onmessage: async (msg: any) => {
          let delta = '';
          if (msg.serverContent?.outputTranscription?.text) {
            delta = msg.serverContent.outputTranscription.text;
          } else if (msg.serverContent?.modelTurn?.parts) {
            for (const p of msg.serverContent.modelTurn.parts) {
              if (p.text) delta += p.text;
            }
          }

          if (delta) {
            this.accumulatedText += delta;
            process.stdout.write(delta);
          }

          if (msg.toolCall?.functionCalls && this.config.executeTool) {
            const functionResponses = msg.toolCall.functionCalls.map((call: any) => {
              console.log('\n   🛠️ [VERKTYG] Exekverar: ' + call.name);
              return {
                id: call.id,
                name: call.name,
                response: { result: this.config.executeTool!(call.name, call.args) },
              };
            });
            this.session.sendToolResponse({ functionResponses });
          }

          const isComplete =
            msg.serverContent?.turnComplete === true ||
            msg.interactionStatus === 'IDLE' ||
            msg.serverContent?.interactionStatus === 'IDLE';

          if (isComplete && this.currentResolver) {
            console.log('\n   🏁 [VÄNDA KLAR]');
            const res = this.currentResolver;
            const text = this.accumulatedText.trim();
            this.currentResolver = null;
            this.currentRejecter = null;
            this.accumulatedText = '';
            res(text);
          }
        },
        onerror: (err: any) => {
          console.error('\n   ❌ [WS-FEL]:', err.message || err);
          if (this.currentRejecter) {
            const rej = this.currentRejecter;
            this.currentResolver = null;
            this.currentRejecter = null;
            rej(err);
          }
        },
        onclose: () => {
          this.session = null;
        },
      },
    });
    console.log(' Uppkopplad!');
  }

  async send(text: string, timeoutMs = 90000): Promise<string> {
    if (!this.session) await this.connect();
    this.accumulatedText = '';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentResolver = null;
        this.currentRejecter = null;
        reject(new Error('Bidi Live timeout (' + timeoutMs + 'ms)'));
      }, timeoutMs);

      this.currentResolver = (val: string) => {
        clearTimeout(timer);
        resolve(val);
      };
      this.currentRejecter = (err: any) => {
        clearTimeout(timer);
        reject(err);
      };

      console.log('   📤 Skickar uppdrag till modellen...');
      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      });
    });
  }

  close(): void {
    if (this.session?.close) {
      try {
        this.session.close();
      } catch {}
    }
    this.session = null;
  }
}
