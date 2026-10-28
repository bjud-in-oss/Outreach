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
  private toolExecutionInProgress = false;

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
          // 1. Fånga explicita backend-fel omedelbart
          if (msg.error) {
            console.error('\n   ❌ [SERVER-FEL FRÅN GOOGLE]:', JSON.stringify(msg.error, null, 2));
            if (this.currentRejecter) {
              const rej = this.currentRejecter;
              this.currentResolver = null;
              this.currentRejecter = null;
              rej(new Error(`Google Live API fel (${msg.error.code || 'UNKNOWN'}): ${msg.error.message}`));
            }
            return;
          }

          // 2. Ackumulera transkriberad och strömmad text
          let delta = '';
          if (msg.serverContent?.outputTranscription?.text) {
            delta += msg.serverContent.outputTranscription.text;
          }
          if (msg.serverContent?.modelTurn?.parts) {
            for (const p of msg.serverContent.modelTurn.parts) {
              if (p.text) delta += p.text;
            }
          }

          if (delta) {
            this.accumulatedText += delta;
            process.stdout.write(delta);
          } else if (msg.serverContent?.modelTurn?.parts?.some((p: any) => p.inlineData)) {
            process.stdout.write('~');
          }

          // 3. Hantera verktygsanrop
          if (msg.toolCall?.functionCalls && this.config.executeTool) {
            this.toolExecutionInProgress = true;
            const functionResponses = msg.toolCall.functionCalls.map((call: any) => {
              console.log('\n   🛠️ [VERKTYG] Exekverar: ' + call.name);
              return {
                id: call.id,
                name: call.name,
                response: { result: this.config.executeTool!(call.name, call.args) },
              };
            });
            this.session.sendToolResponse({ functionResponses });
            this.toolExecutionInProgress = false;
          }

          // 4. Slutvillkor:
          // För extended-thinking-modeller slutförs en vända när servern når IDLE.
          // Om servern signalerar turnComplete och modellen har levererat substantiellt innehåll (>120 tecken),
          // eller om interactionStatus är IDLE, är vändan klar.
          const isIdle =
            msg.interactionStatus === 'IDLE' ||
            msg.serverContent?.interactionStatus === 'IDLE';

          const isSubstantialTurnComplete =
            msg.serverContent?.turnComplete === true &&
            !this.toolExecutionInProgress &&
            (this.accumulatedText.includes('```') || this.accumulatedText.trim().length > 120);

          if ((isIdle || isSubstantialTurnComplete) && this.currentResolver && this.accumulatedText.trim().length > 0) {
            console.log('\n   🏁 [VÄNDA SLUTFÖRD]');
            const res = this.currentResolver;
            const text = this.accumulatedText.trim();
            this.currentResolver = null;
            this.currentRejecter = null;
            this.accumulatedText = '';
            res(text);
          }
        },
        onerror: (err: any) => {
          console.error('\n   ❌ [WS-SOCKET-FEL]:', err.message || err);
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

  async send(text: string, timeoutMs = 120000): Promise<string> {
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
