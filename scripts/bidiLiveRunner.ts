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
    return new Promise(async (resolve, reject) => {
      try {
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
            onopen: () => resolve(),
            onmessage: async (msg: any) => {
              if (msg.serverContent?.outputTranscription?.text) {
                this.accumulatedText += msg.serverContent.outputTranscription.text;
              }
              if (msg.serverContent?.modelTurn?.parts) {
                for (const p of msg.serverContent.modelTurn.parts) {
                  if (p.text) this.accumulatedText += p.text;
                }
              }
              if (msg.toolCall?.functionCalls && this.config.executeTool) {
                const functionResponses = msg.toolCall.functionCalls.map((call: any) => ({
                  id: call.id,
                  name: call.name,
                  response: { result: this.config.executeTool!(call.name, call.args) },
                }));
                this.session.sendToolResponse({ functionResponses });
              }
              const isIdle =
                msg.interactionStatus === 'IDLE' ||
                msg.serverContent?.interactionStatus === 'IDLE';
              if (isIdle && this.currentResolver) {
                const res = this.currentResolver;
                const text = this.accumulatedText.trim();
                this.currentResolver = null;
                this.currentRejecter = null;
                this.accumulatedText = '';
                res(text);
              }
            },
            onerror: (err: any) => {
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
      } catch (err) {
        reject(err);
      }
    });
  }

  async send(text: string, timeoutMs = 90000): Promise<string> {
    if (!this.session) await this.connect();
    this.accumulatedText = '';
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentResolver = null;
        this.currentRejecter = null;
        reject(new Error(`Bidi Live timeout (${timeoutMs}ms)`));
      }, timeoutMs);

      this.currentResolver = (val: string) => {
        clearTimeout(timer);
        resolve(val);
      };
      this.currentRejecter = (err: any) => {
        clearTimeout(timer);
        reject(err);
      };
      this.session.sendRealtimeInput({ text });
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
