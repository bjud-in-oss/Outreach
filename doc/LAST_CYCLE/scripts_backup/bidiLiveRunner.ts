import { GoogleGenAI } from '@google/genai';

export interface BidiRunnerConfig {
  ai: GoogleGenAI;
  model: string;
  systemInstruction: string;
  tools?: any[];
  executeTool?: (name: string, args: any) => string;
}

export class BidiLiveSession {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  private session: any = null;
  private isClosed = false;
  private isIntentionalClose = false;
  private isConnecting = false;
  private currentResolver: ((text: string) => void) | null = null;
  private currentRejecter: ((err: any) => void) | null = null;
  private accumulatedText = '';
  private pendingText: string | null = null;
  private reconnectTimer: any = null;

  constructor(private config: BidiRunnerConfig) {}

  private async waitForSession(maxWaitMs = 15000): Promise<any> {
    if (this.session && !this.isClosed) return this.session;
    const startTime = Date.now();
    while ((!this.session || this.isClosed) && !this.isIntentionalClose && Date.now() - startTime < maxWaitMs) {
      await new Promise((r) => setTimeout(r, 25));
    }
    if (this.isIntentionalClose) {
      throw new Error('WebSocket-sessionen stängdes av klienten.');
    }
    if (!this.session || this.isClosed) {
      throw new Error(`Timeout: Bidi Live session blev inte tillgänglig inom ${maxWaitMs}ms.`);
    }
    return this.session;
  }

  async connect(): Promise<void> {
    if (this.session && !this.isClosed) return;

    const isExtendedThinking = this.config.model.includes('extended-thinking');
    const modality = process.env.BIDI_MODALITY;

    for (let attempt = 0; attempt <= this.maxReconnectAttempts; attempt++) {
      this.isClosed = false;
      this.isIntentionalClose = false;
      this.isConnecting = true;
      process.stdout.write(`   📡 Ansluter Bidi Live WebSocket (${this.config.model})...`);

      const connectConfig: any = {
        systemInstruction: {
          parts: [{ text: this.config.systemInstruction }],
        },
      };

      if (modality === 'TEXT') {
        connectConfig.responseModalities = ['TEXT'];
      } else {
        connectConfig.responseModalities = ['AUDIO'];
        connectConfig.outputAudioTranscription = {};
      }

      if (isExtendedThinking) {
        connectConfig.thinkingConfig = { thinkingLevel: 'low' };
      }

      if (this.config.tools && this.config.tools.length > 0) {
        connectConfig.tools = [{ functionDeclarations: this.config.tools }];
      }

      let rejectHandshake: ((err: any) => void) | null = null;
      const handshakeGuard = new Promise<never>((_, rej) => {
        rejectHandshake = rej;
      });
      const hsTimer = setTimeout(() => {
        if (rejectHandshake) rejectHandshake(new Error('Handskaknings-timeout (15000ms)'));
      }, 15000);

      try {
        const sessionPromise = (this.config.ai as any).live.connect({
          model: this.config.model,
          config: connectConfig,
          callbacks: {
            onmessage: async (msg: any) => {
              if (this.isClosed) return;
              if (msg.error) {
                console.error('\n   ❌ [SERVER-FEL FRÅN GOOGLE]:', JSON.stringify(msg.error, null, 2));
                if (this.currentRejecter) {
                  const rej = this.currentRejecter;
                  this.currentResolver = null;
                  this.currentRejecter = null;
                  this.pendingText = null;
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

              this.reconnectAttempts = 0;

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
                this.pendingText = null;
                this.accumulatedText = '';
                res(text);
              }
            },
            onerror: (err: any) => {
              if (this.isIntentionalClose) return;
              console.error('\n   ❌ [WS-SOCKET-FEL]:', err.message || err);
              if (this.isConnecting && rejectHandshake) {
                rejectHandshake(err);
                return;
              }
              if (this.currentRejecter) {
                const rej = this.currentRejecter;
                this.currentResolver = null;
                this.currentRejecter = null;
                this.pendingText = null;
                rej(err);
              }
            },
            onclose: (event: any) => {
              const code = event?.code || 'NORMAL';
              const reason = event?.reason || 'Ingen orsak';
              this.session = null;
              this.isClosed = true;

              if (this.isIntentionalClose) return;

              if (this.isConnecting && rejectHandshake) {
                rejectHandshake(new Error(`WebSocket stängdes under handskakning (kod: ${code})`));
                return;
              }

              if (!this.currentResolver && !this.pendingText) {
                return;
              }

              if ((code === 1011 || code === 1006) && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.pow(2, this.reconnectAttempts) * 1000;
                console.warn(`\n⚠️ [WS ${code} AVBROTT]: Återansluter automatiskt (försök ${this.reconnectAttempts}/${this.maxReconnectAttempts}) om ${delay}ms...`);

                this.reconnectTimer = setTimeout(async () => {
                  try {
                    await this.connect();
                    if (this.pendingText && this.session && !this.isClosed) {
                      console.log('   🔄 Skickar om väntande text efter återanslutning...');
                      await this.session.sendClientContent({
                        turns: [{ role: 'user', parts: [{ text: this.pendingText }] }],
                        turnComplete: true,
                      });
                    }
                  } catch (e: any) {
                    if (this.currentRejecter) {
                      const rej = this.currentRejecter;
                      this.currentResolver = null;
                      this.currentRejecter = null;
                      this.pendingText = null;
                      rej(e);
                    }
                  }
                }, delay);
                return;
              }

              if (this.currentRejecter) {
                const rej = this.currentRejecter;
                this.currentResolver = null;
                this.currentRejecter = null;
                this.pendingText = null;
                rej(new Error(`WebSocket stängdes av servern (kod: ${code}, orsak: ${reason})`));
              }
            },
          },
        });

        const resolvedSession = await Promise.race([sessionPromise, handshakeGuard]);
        clearTimeout(hsTimer);
        this.isConnecting = false;

        if (this.isClosed) {
          throw new Error('WebSocket stängdes omedelbart efter handskakning.');
        }

        this.session = resolvedSession;
        console.log(' Uppkopplad!');
        return;
      } catch (err: any) {
        clearTimeout(hsTimer);
        this.isConnecting = false;
        this.session = null;
        this.isClosed = true;

        if (attempt < this.maxReconnectAttempts && !this.isIntentionalClose) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          console.warn(`\n⚠️ [HANDSKAKNING AVBRÖTS]: ${err?.message || err}. Försöker igen (${attempt + 1}/${this.maxReconnectAttempts}) om ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  async send(text: string, timeoutMs = 120000): Promise<string> {
    this.pendingText = text;
    this.accumulatedText = '';

    if (!this.session || this.isClosed) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentResolver = null;
        this.currentRejecter = null;
        this.pendingText = null;
        reject(new Error(`Bidi Live timeout efter ${timeoutMs}ms`));
      }, timeoutMs);

      this.currentResolver = (val: string) => {
        clearTimeout(timer);
        this.pendingText = null;
        resolve(val);
      };
      this.currentRejecter = (err: any) => {
        clearTimeout(timer);
        this.pendingText = null;
        reject(err);
      };

      console.log('   📤 Skickar uppdrag till modellen...');
      this.reconnectAttempts = 0;
      this.waitForSession()
        .then((activeSession) => {
          activeSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text }],
              },
            ],
            turnComplete: true,
          });
        })
        .catch((err: any) => {
          if (this.currentRejecter) {
            const rej = this.currentRejecter;
            this.currentResolver = null;
            this.currentRejecter = null;
            this.pendingText = null;
            rej(err);
          }
        });
    });
  }

  close(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingText = null;

    if (this.session?.close) {
      try {
        this.session.close();
      } catch (err) {
        void err;
      }
    }
    this.session = null;
    this.isClosed = true;
  }
}
