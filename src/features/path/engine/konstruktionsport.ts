import { KonstruktionsportOptions, Port, PortNekadError } from '../model/types';

export function skapaKonstruktionsport(options: KonstruktionsportOptions): Port {
  return async (kontext: any) => {
    for (const krav of options.matris) {
      const inspektion = await options.inspekterare(krav, options.barrelVag);

      if (!inspektion.existerar) {
        return { 
          oppnad: false, 
          orsak: `Källkodsfil saknas: "${krav.filVag}"`, 
          omvandelseKrav: 'SKAPA_FILER' 
        };
      }

      if (krav.maxRader && inspektion.antalRader > krav.maxRader) {
        return { 
          oppnad: false, 
          orsak: `Fil "${krav.filVag}" överskrider radgräns (${inspektion.antalRader} > ${krav.maxRader})`, 
          omvandelseKrav: 'MODULÄR_EXPANSION' 
        };
      }

      if (krav.kravsExport && inspektion.exporteradIIndex === false) {
        return { 
          oppnad: false, 
          orsak: `Modul "${krav.filVag}" saknar exportdeklaration i barrel-filen`, 
          omvandelseKrav: 'UPPDATERA_INDEX' 
        };
      }
    }

    return { oppnad: true };
  };
}

export async function knackaPaPorten(port: Port, kontext: any) {
  const resultat = await port(kontext);
  if (!resultat.oppnad) {
    throw new PortNekadError(resultat.orsak || 'Porten nekad', resultat.omvandelseKrav);
  }
  return resultat;
}
