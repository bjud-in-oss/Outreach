import * as fs from 'fs';
import * as path from 'path';
import { BidiLiveSession } from '../bidiLiveRunner.js';
import { getFeatureIndexText, getInstalledDependencies, appendCycleLog } from './channelRunner.js';

interface ChannelOptions {
  requireMutation?: boolean;
  maxTurns?: number;
  onMutationCheck?: () => boolean;
  getFollowupPrompt?: () => string;
}

export async function runMicroChannel(
  ai: any,
  modelName: string,
  kraft: 'Att följa' | 'Att vända om' | 'Att förlikas',
  stepInstruction: string,
  startAnchor: string,
  si: string,
  tools: any[] = [],
  executeTool?: (name: string, args: any) => string,
  options: ChannelOptions = {}
): Promise<string> {
  const runner = new BidiLiveSession({
    ai,
    model: modelName,
    systemInstruction: `${si}\n\nREPOTOPOGRAFI:\n${getFeatureIndexText()}\n\n${getInstalledDependencies()}\n\nDu agerar som kraften: ${kraft}.\nUppgift: ${stepInstruction}`,
    tools,
    executeTool,
  });

  try {
    let response = await runner.send(`STARTANKARE:\n${startAnchor}\n\nUPPDRAG:\n${stepInstruction}`);
    
    const maxTurns = options.maxTurns || 3;
    let turn = 1;

    while (options.requireMutation && options.onMutationCheck && !options.onMutationCheck() && turn < maxTurns) {
      turn++;
      const followUp = options.getFollowupPrompt ? options.getFollowupPrompt() : `Du har genomfört inspektion. Slutför nu uppdraget omedelbart! Använd 'apply_patch' för att uppdatera befintliga filer, eller 'save_code' om du skapar en helt ny fil.`;
      console.log(`\n   🔁 [ACTION LOOP]: Krav ej uppfyllt ännu. Fortsätter mikrokanalen (vända ${turn}/${maxTurns})...`);
      response = await runner.send(followUp);
    }

    runner.close();
    await new Promise((r) => setTimeout(r, 400));
    return response;
  } catch (err: any) {
    runner.close();
    await new Promise((r) => setTimeout(r, 400));
    throw err;
  }
}

export async function exekveraFas1Sweep(
  ai: any,
  modelName: string,
  ticketPrompt: string,
  systemInstruction: string,
  startAnchor: string,
  inspectionTools: any[],
  executeInspection: (name: string, args: any) => string,
  appendCycleLogFn: typeof appendCycleLog
): Promise<string> {
  console.log('### FAS 0: PREMISSVALIDERING & DÖRRVAKT');
  
  const steg1a = await runMicroChannel(ai, modelName, 'Att följa', 'Steg 1a: Förstå Intention & Mänsklig Nytta.', ticketPrompt, systemInstruction, [], undefined, {});
  appendCycleLogFn('1a Att följa: Intention & Nytta', steg1a);

  const steg0a = await runMicroChannel(ai, modelName, 'Att vända om', 'Steg 0a: Kontraktsaudit.', `${ticketPrompt}\n\nINTENTION:\n${steg1a}`, systemInstruction, [], undefined, {});
  appendCycleLogFn('0a Att vända om: Kontraktsaudit', steg0a);

  const steg0b = await runMicroChannel(ai, modelName, 'Att förlikas', 'Steg 0b: Vägval. Svara enbart "STATUS: GODKÄND" om godkänd.', steg0a, systemInstruction, [], undefined, {});
  appendCycleLogFn('0b Att förlikas: Vägval', steg0b);

  if (!steg0b.includes('GODKÄND')) {
    throw new Error('❌ Fas 0 underkändes av Att förlikas.');
  }

  console.log('\n### FAS 1: LINJÄRT PLANERINGSSVEP (MIKRO-OSCILLATION)');

  const steg1b = await runMicroChannel(ai, modelName, 'Att följa', 'Steg 1b: Kartlägg domängränser via read_file och list_files.', startAnchor, systemInstruction, inspectionTools, executeInspection, {});
  appendCycleLogFn('1b Att följa: Domängränser', steg1b);

  const steg2b = await runMicroChannel(ai, modelName, 'Att följa', 'Steg 2b: Formulera 3 ortogonala alternativ för lösning.', `${startAnchor}\n${steg1b}`, systemInstruction, inspectionTools, executeInspection, {});
  appendCycleLogFn('2b Att följa: 3 Alternativ', steg2b);

  const steg2c = await runMicroChannel(ai, modelName, 'Att vända om', 'Steg 2c: Resiliensgranskning av alternativen.', `${startAnchor}\n${steg2b}`, systemInstruction, inspectionTools, executeInspection, {});
  appendCycleLogFn('2c Att vända om: Resiliensgranskning', steg2c);

  const steg2d = await runMicroChannel(ai, modelName, 'Att förlikas', 'Steg 2d: Slå fast vinnande alternativ. Deklarera MÄTTNAD: JA.', steg2c, systemInstruction, inspectionTools, executeInspection, {});
  appendCycleLogFn('2d Att förlikas: Mättnad', steg2d);

  return steg2d;
}
