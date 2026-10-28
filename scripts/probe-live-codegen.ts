import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY saknas i miljön.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = process.env.LIVE_MODEL || 'gemini-3.8-live-extended-thinking';

console.log(`🔬 STARTAR OBEROENDE LIVE PROV`);
console.log(`📌 Modell: ${MODEL}`);

let receivedCode = '';
let spokenResponse = '';

// Strikt NON_BLOCKING enligt specifikationen för Extended Thinking
const saveCodeTool = {
  name: 'save_code',
  behavior: 'NON_BLOCKING',
  description: 'Anropas för att spara den genererade källkoden till filsystemet.',
  parameters: {
    type: 'OBJECT',
    properties: {
      filename: { type: 'STRING', description: 'Filnamn, t.ex. ping.ts' },
      code: { type: 'STRING', description: 'Den fullständiga TypeScript-källkoden.' },
    },
    required: ['filename', 'code'],
  },
};

async function runProbe() {
  let session: any = null;

  await new Promise<void>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('\n⏱️ Timeout nådd (45 sekunder).');
      if (session) session.close();
      resolve();
    }, 45000);

    try {
      // Exakt konfiguration enligt references/migration.md avsnitt 3
      const liveConfig: any = {
        responseModalities: ['audio'],
        outputAudioTranscription: {},
        tools: [{ functionDeclarations: [saveCodeTool] }],
        systemInstruction: {
          parts: [
            {
              text: 'Du är en programmerare. När du får ett uppdrag: 1. Berätta kort i tal vad du gör. 2. Anropa verktyget save_code med TypeScript-koden.',
            },
          ],
        },
      };

      // thinkingConfig krävs för extended-thinking, men ska utelämnas för standard live
      if (MODEL.includes('extended-thinking')) {
        liveConfig.thinkingConfig = { thinkingLevel: 'low' };
      }

      console.log('📡 Ansluter WebSocket mot Google...');
      session = await (ai as any).live.connect({
        model: MODEL,
        config: liveConfig,
        callbacks: {
          onmessage: async (msg: any) => {
            // Logga eventuella serverfel direkt från backend
            if (msg.error) {
              console.error('\n❌ SERVERFEL FRÅN GOOGLE:', JSON.stringify(msg.error, null, 2));
            }

            // Talad transkribering
            if (msg.serverContent?.outputTranscription?.text) {
              const text = msg.serverContent.outputTranscription.text;
              spokenResponse += text;
              process.stdout.write(text);
            }

            // Indikera inkommande rå PCM-ström
            if (msg.serverContent?.modelTurn?.parts?.some((p: any) => p.inlineData)) {
              process.stdout.write('~');
            }

            // Asynkront verktygsanrop
            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                console.log(`\n\n🛠️ [VERKTYG ANROPAT]: ${call.name}`);
                if (call.name === 'save_code') {
                  receivedCode = call.args?.code || '';
                  console.log(`📁 Målfil: ${call.args?.filename}`);
                  console.log(`📝 Mottagen källkod:\n---\n${receivedCode}\n---`);
                }

                // Bekräfta verktyget enligt specifikationen
                session.sendToolResponse({
                  functionResponses: [
                    {
                      id: call.id,
                      name: call.name,
                      response: { result: 'Filen sparades framgångsrikt.' },
                    },
                  ],
                });
              }
            }

            // Hantera tillståndsmaskinen (IDLE)
            if (msg.interactionStatus) {
              process.stdout.write(` [Status: ${msg.interactionStatus}] `);
            }

            if (msg.interactionStatus === 'IDLE' && (receivedCode || spokenResponse.length > 50)) {
              console.log('\n\n🏁 Sessionen nådde IDLE och uppdraget är slutfört.');
              clearTimeout(timeout);
              session.close();
              resolve();
            }
          },
          onerror: (err: any) => {
            console.error('\n❌ WebSocket-fel:', err);
            clearTimeout(timeout);
            reject(err);
          },
          onclose: (ev: any) => {
            console.log(`\n🔌 WebSocket stängdes (Kod: ${ev?.code ?? 'N/A'}, Orsak: ${ev?.reason ?? 'N/A'})`);
          },
        },
      });

      console.log('✅ Uppkopplad! Skickar uppdrag till modellen...');

      session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: 'Uppdrag: Skapa en TypeScript-funktion `emitPing` som returnerar `{ type: "ping", timestamp: number }`. Anropa save_code med filnamnet "ping.ts" och källkoden.',
              },
            ],
          },
        ],
        turnComplete: true,
      });
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });

  console.log('\n================ UTFALL ================');
  console.log('Talad respons:', spokenResponse.trim() || '(Inget tal)');
  if (receivedCode) {
    console.log('✅ VERKLIG KÄLLKOD GENERERADES VIA TOOL-CALL!');
  } else {
    console.log('❌ INGEN KÄLLKOD GENERERADES.');
  }
  console.log('========================================\n');
}

runProbe().catch(console.error);
