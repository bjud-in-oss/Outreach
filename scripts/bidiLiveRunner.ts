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

    const isExtendedThinking = this.config.model.includes('extended-thinking');

    process.stdout.write(`   📡 Ansluter Bidi Live WebSocket (${this.config.model})...`);
    
    const connectConfig: any = {
      responseModalities: ['audio'],
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [{ text: this.config.systemInstruction }],
      },
    };

    if (isExtendedThinking) {
      connectConfig.thinkingConfig = { thinkingLevel: 'low' };
    }

    if (this.config.tools && this.config.tools.length > 0) {
      connectConfig.tools = [{ functionDeclarations: this.config.tools }];
    }

    this.session = await (this.config.ai as any).live.connect({
      model: this.config.model,
      config: connectConfig,
      callbacks: {
        onmessage: async (msg: any) => {
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

          // Hantera verktygsanrop
          if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0 && this.config.executeTool) {
            const functionResponses = msg.toolCall.functionCalls.map((call: any) => {
              console.log(`\n   🛠️ [VERKTYG ANROPAT]: ${call.name} (id: ${call.id})`);
              try {
                const output = this.config.executeTool!(call.name, call.args);
                return {
                  id: call.id,
                  name: call.name,
                  response: { result: output },
                };
              } catch (err: any) {
                return {
                  id: call.id,
                  name: call.name,
                  response: { error: `Verktygsfel (${call.name}): ${err.message || String(err)}` },
                };
              }
            });

            await this.session.sendToolResponse({ functionResponses });
            // KRITISK PRINCIP: Denna frame är ett verktygsanrop. Vändan är INTE klar.
            // Returnera här så att modellen hinner ta emot svaret och generera text.
            return;
          }

          // Slutvillkor
          let turnIsDone = false;
          if (isExtendedThinking) {
            if (msg.interactionStatus === 'IDLE' || msg.serverContent?.interactionStatus === 'IDLE') {
              turnIsDone = true;
            }
          } else {
            if (msg.serverContent?.turnComplete === true) {
              turnIsDone = true;
            }
          }

          if (turnIsDone && this.currentResolver) {
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
        reject(new Error(`Bidi Live timeout efter ${timeoutMs}ms`));
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
