import { Port, PathContext, PathRecipe, PortResult } from "../model/types";

export class PortNekadError extends Error {
  constructor(public orsak?: any, public omvandelseKrav?: string) {
    const meddelande = typeof orsak === "string" ? orsak : (orsak?.orsak || "Ingen orsak angavs");
    super(`Port nekad: ${meddelande}`);
    this.name = "PortNekadError";
    if (typeof orsak === "object" && orsak !== null) {
      this.omvandelseKrav = orsak.omvandelseKrav || omvandelseKrav;
    }
  }
}

export async function knackaPaPorten(port: any, kontext: PathContext): Promise<PortResult> {
  const exekverbar = typeof port === "function" ? port : (port?.oppna || port?.port || port?.run);
  if (typeof exekverbar !== "function") {
    throw new PortNekadError("Objektet saknar körbar portfunktion", "OGILTIG_PORT");
  }
  const resultat: PortResult = await exekverbar(kontext || {});
  if (!resultat || !resultat.oppnad) {
    throw new PortNekadError(resultat?.orsak || "Porten förblev stängd", resultat?.omvandelseKrav);
  }
  return resultat;
}

export async function exekveraRecept(
  recipe: PathRecipe, 
  kontext: PathContext = {},
  options: { 
    maxOmvandelseForsok?: number; 
    onOmvandelse?: (fel: any, kontext: PathContext, forsok: number) => void;
  } = {}
): Promise<{ success: boolean; sucess: boolean; slutfold: boolean }> {
  const maxForsok = options.maxOmvandelseForsok ?? 1;
  const nodLista = (recipe as any)?.nodes || (recipe as any)?.noder || (recipe as any)?.steg || [];
  
  for (const node of nodLista) {
    const nodFas = bestamFasForSteg(node.id);
    const berikadKontext: PathContext = {
      ...kontext,
      aktuellFas: nodFas
    };

    let forsok = 0;
    let stegKlart = false;

    while (!stegKlart) {
      try {
        const rawType = (node.type || "").toUpperCase();
        if (rawType === "STEP" || (!rawType && (node.execute || node.run || node.exekvera))) {
          const exec = node.execute || node.run || node.exekvera;
          if (typeof exec === "function") {
            const result = await exec(berikadKontext);
            if (!result || (!result.success && result.status !== 'success')) {
              throw new Error(`Steg misslyckades: ${node.name || node.id || "Okänt steg"}`);
            }
          }
        } else if (rawType === "PORT" || (!rawType && node.port)) {
          const portFn = node.port || node.run || node.oppna;
          if (portFn) {
            await knackaPaPorten(portFn, berikadKontext);
          }
        } else if (typeof node === "function") {
          await knackaPaPorten(node, berikadKontext);
        }
        stegKlart = true;
      } catch (err: any) {
        forsok++;
        if (options.onOmvandelse) {
          options.onOmvandelse(err, berikadKontext, forsok);
        }

        if (forsok >= maxForsok) {
          throw err;
        }
        // Vid PortNekadError och återstående försök, loopa om
      }
    }
  }
  return { success: true, sucess: true, slutfold: true };
}

export function bestamFasForSteg(stegId: string): string {
  if (stegId === 'p1' || stegId.startsWith('step-1a') || stegId.startsWith('step-0') || stegId.startsWith('avsikt')) {
    return 'avsikt';
  }
  if (stegId === 'p2' || stegId.startsWith('step-1b') || stegId.startsWith('step-2') || stegId.startsWith('step-3') || stegId.startsWith('provning')) {
    return 'provning';
  }
  if (stegId === 'port-konstruktion' || stegId.startsWith('p3') || stegId.startsWith('step-fas2') || stegId.startsWith('konstruktion')) {
    return 'konstruktion';
  }
  if (stegId === 'p4' || stegId.startsWith('step-fas3') || stegId.startsWith('besiktning')) {
    return 'besiktning';
  }
  return 'avsikt';
}
