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
  private isClosed = false;
  private currentResolver: ((text: string) => void) | null = null;
  private currentRejecter: ((err: any) => void) | null = null;
  private accumulatedText = '';

  constructor(private config: BidiRunnerConfig) {}

  private async waitForSession(maxWaitMs = 5000): Promise<any> {
    if (this.session) return this.session;
    const startTime = Date.now();
    while (!this.session && !this.isClosed && Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 25));
    }
    if (this.isClosed) {
      throw new Error('WebSocket-sessionen stängdes av servern innan verktygssvaret kunde levereras.');
    }
    if (!this.session) {
      throw new Error(`Timeout: Bidi Live session blev inte tillgänglig inom ${maxWaitMs}ms.`);
    }
    return this.session;
  }

  async connect(): Promise<void> {
    if (this.session && !this.isClosed) return;
    this.isClosed = false;

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

    const sessionPromise = (this.config.ai as any).live.connect({
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
            const activeSession = await this.waitForSession();

            const functionResponses = msg.toolCall.functionCalls.map((call: any) => {
              console.log(`\n   🛠️ [VERKTYG ANROPAT]: ${call.name} (id: ${call.id})`);
              console.log(`   📦 [ARGUMENT]:`, JSON.stringify(call.args, null, 2));
              try {
                const output = this.config.executeTool!(call.name, call.args);
                console.log(`   📤 [VERKTYGSRETUR]:`, output.length > 300 ? `${output.slice(0, 300)}... (${output.length} tecken)` : output);
                return {
                  id: call.id,
                  name: call.name,
                  response: { result: output },
                };
              } catch (err: any) {
                console.error(`   ❌ [VERKTYGSFEL]:`, err.message || err);
                return {
                  id: call.id,
                  name: call.name,
                  response: { error: `Verktygsfel (${call.name}): ${err.message || String(err)}` },
                };
              }
            });

            await activeSession.sendToolResponse({ functionResponses });
            return;
          }

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
        onclose: (event: any) => {
          const code = event?.code || 'NORMAL';
          const reason = event?.reason || 'Ingen orsak';
          this.session = null;
          this.isClosed = true;
          if (this.currentRejecter) {
            const rej = this.currentRejecter;
            this.currentResolver = null;
            this.currentRejecter = null;
            rej(new Error(`WebSocket stängdes av servern (kod: ${code}, orsak: ${reason})`));
          }
        },
      },
    });

    this.session = await sessionPromise;
    console.log(' Uppkopplad!');
  }

  async send(text: string, timeoutMs = 120000): Promise<string> {
    if (!this.session || this.isClosed) {
      await this.connect();
    }
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
    this.isClosed = true;
  }
}
