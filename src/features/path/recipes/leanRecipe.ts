import { Port, PathRecipe } from '../model/types';

export interface LeanReceptOptions {
  avsikt: Port;
  provning: Port;
  konstruktion: Port;
  besiktning: Port;
}

export function skapaLeanRecept(options: LeanReceptOptions): PathRecipe {
  return {
    id: "path-lean",
    name: "Vägen Lean 4-Portar",
    description: "Deklarativ 4-ports tillståndsmaskin",
    nodes: [
      { id: "p1", name: "Avsikt", type: "PORT", port: options.avsikt },
      { id: "p2", name: "Provning", type: "PORT", port: options.provning },
      { id: "p3", name: "Konstruktion", type: "PORT", port: options.konstruktion },
      { id: "p4", name: "Besiktning", type: "PORT", port: options.besiktning }
    ]
  };
}
