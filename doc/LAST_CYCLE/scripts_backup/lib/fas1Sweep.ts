import * as fs from 'fs';
import * as path from 'path';
import { 
  getFeatureIndexText, 
  getInstalledDependencies, 
  appendCycleLog, 
  runMicroChannel,
  inspectionTools,
  executeInspection
} from './channelRunner.js';

export { runMicroChannel };

function getCompactTicketWindow(): string {
  return "Kompakt fönster för hantering av ticket-scope.";
}

function validateTicketScope(ticketPrompt: string): boolean {
  console.log("Validerar scope för ticket:", ticketPrompt);
  return true;
}

export async function exekveraFas1Sweep(
  ai: any,
  modelName: string,
  ticketPrompt: string,
  systemInstruction: string,
  startAnchor: string,
  isMaint: boolean,
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

  if (!isMaint) {
    console.log('\n### FAS 1.5: YTTERLIGARE STEG FÖR ICKE-MAINT');
    
    const steg3a = await runMicroChannel(ai, modelName, 'Att följa', 'Steg 3a: Formulera Transient Testspecifikation.', `${startAnchor}\n${steg2d}`, systemInstruction, [], undefined, {});
    appendCycleLogFn('3a Att följa: Transient Testspecifikation', steg3a);

    const steg3b = await runMicroChannel(ai, modelName, 'Att följa', 'Steg 3b: Exakt Källkodsspecifikation.', `${startAnchor}\n${steg3a}`, systemInstruction, [], undefined, {});
    appendCycleLogFn('3b Att följa: Källkodsspecifikation', steg3b);

    const steg3c = await runMicroChannel(ai, modelName, 'Att förlikas', 'Steg 3c: Slutgiltigt Byggkontrakt.', `${startAnchor}\n${steg3b}`, systemInstruction, [], undefined, {});
    appendCycleLogFn('3c Att förlikas: Slutgiltigt Byggkontrakt', steg3c);

    return steg3c;
  }

  return steg2d;
}
