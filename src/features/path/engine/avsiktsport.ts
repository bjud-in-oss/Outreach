import { Port, AvsiktsportOptions } from '../model/types';

export function skapaAvsiktsport(options: AvsiktsportOptions): Port {
  return async (kontext) => {
    const fraga = options.exempel 
      ? `${options.beskrivning} (Exempel: ${options.exempel})` 
      : options.beskrivning;
      
    const raaSvar = await options.prompter(fraga);
    const rentSvar = (raaSvar || '').trim().toLowerCase();

    if (rentSvar === '' || ['y', 'ja', 'kör', 'ok'].includes(rentSvar)) {
      return { oppnad: true };
    }

    if (['n', 'nej', 'stopp', 'avbryt'].includes(rentSvar)) {
      return { 
        oppnad: false, 
        orsak: 'Människan avvisade intentionen vid Avsiktsporten', 
        omvandelseKrav: 'AVBRYT' 
      };
    }

    return { 
      oppnad: false, 
      orsak: `Människan begärde förtydligande: "${(raaSvar || '').trim()}"`, 
      omvandelseKrav: 'SAMRÅD' 
    };
  };
}