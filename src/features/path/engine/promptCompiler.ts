import { PromptCompileInput, CompiledPrompt } from '../model/types';

export function kompileraPrompt(input: PromptCompileInput): CompiledPrompt {
  let systemInstruction = 'Du är en Systemarkitekt och Kodingenjör som främjar närhet och harmoni i systemdesign.';
  
  switch (input.fas) {
    case 'avsikt':
      systemInstruction += ' Fokusera på mänsklig nytta, intention och Gherkin-scenarier.';
      break;
    case 'provning':
      systemInstruction += ' Kräver 3 ortogonala alternativ, resiliensgranskning och epistemisk rannsakan.';
      break;
    case 'konstruktion':
      systemInstruction += ' Fokuserar på TDD, hermetisk isolering och kvalitetsgrindar.';
      break;
    case 'besiktning':
      systemInstruction += ' Fokuserar på debriefing och lärdomar.';
      break;
  }

  const userPrompt = `Uppdrag: ${input.uppdrag}\nTicket: ${input.ticketId}\nDomän: ${input.malDoman}`;
  
  const beraknadeTokensUngefar = Math.ceil((systemInstruction.length + userPrompt.length) / 4);

  return {
    systemInstruction,
    userPrompt,
    beraknadeTokensUngefar
  };
}
