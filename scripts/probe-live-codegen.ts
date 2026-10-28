import { GoogleGenAI } from '@google/genai';

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY saknas i miljön. Kör med --env-file=.env.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = process.env.LIVE_MODEL || 'gemini-3.8-live-extended-thinking';

console.log(`\n🔬 STARTAR OBEROENDE BIDI LIVE PROV`);
console.log(`📌 Modell: ${MODEL}`);

let receivedCode = '';
let spokenResponse = '';

// 1. Strikt NON_BLOCKING function declaration enligt specifikationen
const saveCodeTool = {
  name: 'save_code',
  behavior: 'NON_BLOCKING',
  description: 'Anropas för att spara den genererade källkoden till filsystemet.',
  parameters: {
    type: 'OBJECT',
    properties: {
      filename: { type: 'STRING', description: 'Filnamn, t.ex. ping.ts' },
      code: { type: 'STRING', description: 'Den fullständiga TypeScript-källkoden utan utelämnade delar.' },
    },
    required: ['filename', 'code'],
  },
};

(async function runProbe() {
  let session: any = null;

  await new Promise<void>(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('\n⏱️ Timeout nådd (45 sekunder). Stänger sessionen.');
      if (session) session.close();
      resolve();
    }, 45000);

    try {
      const liveConfig: any = {
        responseModalities: ['audio'],
        outputAudioTranscription: {},
        tools: [{ functionDeclarations: [saveCodeTool] }],
        systemInstruction: {
          parts: [
            {
              text: 'Du är en senior mjukvaruutvecklare. När du får ett programmeringsuppdrag: 1. Tala kort i röstkanalen om vad du gör. 2. Anropa ovillkorligen verktyget save_code med den fullständiga TypeScript-källkoden.',
            },
          ],
        },
      };

      if (MODEL.includes('extended-thinking')) {
        liveConfig.thinkingConfig = { thinkingLevel: 'low' };
      }

      process.stdout.write('   📡 Ansluter WebSocket mot Google...');
      session = await (ai as any).live.connect({
        model: MODEL,
        config: liveConfig,
        callbacks: {
          onmessage: async (msg: any) => {
            if (msg.error) {
              console.error('\n❌ SERVERFEL (Google):', JSON.stringify(msg.error, null, 2));
            }

            if (msg.serverContent?.outputTranscription?.text) {
              const t = msg.serverContent.outputTranscription.text;
              spokenResponse += t;
              process.stdout.write(t);
            }

            if (msg.serverContent?.modelTurn?.parts?.some((p: any) => p.inlineData)) {
              process.stdout.write('~');
            }

            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                console.log(`\n\n🛠️ [TOOL CALL]: ${call.name} (id: ${call.id})`);
                if (call.name === 'save_code') {
                  receivedCode = call.args?.code || '';
                  console.log(`📁 FILNAMN: ${call.args?.filename}`);
                  console.log(`\n📝 MOTTAGEN KÄLLKOD:\n---\n${receivedCode}\n---`);
                }

                session.sendToolResponse({
                  functionResponses: [
                    {
                      id: call.id,
                      name: call.name,
                      response: { result: 'Källkoden sparades framgångsrikt i VFS.' },
                    },
                  ],
                });
              }
            }

            if (msg.interactionStatus) {
              process.stdout.write(`\n[STATUS: ${msg.interactionStatus}] `);
            }

            if (msg.interactionStatus === 'IDLE') {
              console.log('\n\n🏁 InteractionStatus: IDLE nådd — sessionen är klar.');
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

      console.log('  – Kopplad! Skickar uppdrag...');

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

  console.log('\n================ UTFALL PROV ================');
  console.log('Talad respons:', spokenResponse.trim() || '(Inget tal)');
  if (receivedCode.trim()) {
    console.log('✅ VERKLIG KÄLLKOD GENERERADES VIA TOOL CALL!');
  } else {
    console.log('❌ INGEN KÄLLKOD GENERERADES.');
  }
  console.log('============================================\n');
})().catch(err => {
  console.error('\n❌ Haveri i provet:', err);
  process.exit(1);
});
