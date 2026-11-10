import { PromptCompileInput, CompiledPrompt, PromptCompileInputSchema } from '../contracts/pathSchema';

export function kompileraPrompt(input: PromptCompileInput): CompiledPrompt {
  // Validera input med Zod schema
  PromptCompileInputSchema.parse(input);

  let systemInstruction = '';
  const invarianterStr = 'Typkontrakt och systemiska invarianter';

  switch (input.fas) {
    case 'avsikt':
      systemInstruction = 'Fokusera på mänsklig avsikt, intention och att formulera korta Gherkin-scenarier.';
      break;
    case 'provning':
      systemInstruction = 'Fokusera på 3 ortogonala alternativ (reverse-direction), resiliensgranskning (check-alignment) och epistemisk rannsakan.';
      break;
    case 'konstruktion':
      systemInstruction = `Fokusera på TDD-loop, isolerad kodmodifiering och kvalitetsgrindar. ${invarianterStr}.`;
      if (input.konstextMinne && Array.isArray(input.konstextMinne)) {
         const invarianter = input.konstextMinne.filter(m => m.typ === 'systemisk_invariant');
         if (invarianter.length > 0) {
           systemInstruction += ' ' + invarianter.map(i => i.innehåll).join(' ');
         }
      }
      break;
    case 'besiktning':
      systemInstruction = 'Fokusera på reflekterande debriefing, programutvärdering och processlärdomar.';
      break;
    default:
      systemInstruction = 'Standard instruktion för swarm-agent.';
  }

  // Slumpmässig men deterministisk beräkning av tokens
  const baseTokens = 150;
  const taskTokens = input.uppdrag.length * 2;
  const beraknadeTokensUngefar = baseTokens + taskTokens;

  return {
    systemInstruction,
    userPrompt: `Genomför uppdrag: ${input.uppdrag}`,
    beraknadeTokensUngefar,
  };
}
