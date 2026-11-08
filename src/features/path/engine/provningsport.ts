import { ProvningsportOptions, Port, PortResult } from '../model/types';
import { PortNekadError } from './pathRunner';

export function skapaProvningsport(options: ProvningsportOptions): Port {
  return async (kontext): Promise<PortResult> => {
    const resultat = await options.testExekverare(options.testFilVag);

    if (resultat.passerade) {
      return {
        oppnad: false,
        orsak: 'Testet passerade grönt innan källkod implementerats (Falskt positivt / Saknar Fail-First)',
        omvandelseKrav: 'KRÄV_RÖTT_TEST',
      };
    }

    const felmeddelande = resultat.felmeddelande || '';
    if (felmeddelande.toLowerCase().includes(options.forvantatFel.toLowerCase())) {
      return { oppnad: true };
    }

    return {
      oppnad: false,
      orsak: `Testet fallerade av oväntad orsak: "${felmeddelande}". Förväntade: "${options.forvantatFel}"`,
      omvandelseKrav: 'ÅTGÄRDA_TESTSYNTAX',
    };
  };
}

export async function knackaPaPorten(port: Port, kontext: any): Promise<PortResult> {
  const resultat = await port(kontext);
  if (!resultat.oppnad) {
    throw new PortNekadError(resultat.orsak || 'Porten förblev stängd', resultat.omvandelseKrav);
  }
  return resultat;
}
