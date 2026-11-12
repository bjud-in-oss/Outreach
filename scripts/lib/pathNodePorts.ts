import fs from 'fs';
import path from 'path';
import {
  skapaAvsiktsport,
  skapaProvningsport,
  skapaKonstruktionsport,
  skapaBesiktningsport,
} from '../../src/features/path/index.js';
import { execCaptured } from './shellAndBackup.js';

export function skapaNodePathPortar(deps: {
  ticketId: string;
  io: any;
  dryRun?: boolean;
  testFilVag?: string;
  matris?: any[];
  rootDir?: string;
}) {
  const { dryRun = false } = deps;

  if (dryRun !== false) {
    // Returnera säkra minnes-portar för dryRun/tester
    return {
      avsiktsport: skapaAvsiktsport({ io: deps.io }),
      provningsport: skapaProvningsport({ io: deps.io }),
      konstruktionsport: skapaKonstruktionsport({ io: deps.io }),
      besiktningsport: skapaBesiktningsport({ io: deps.io }),
    };
  }

  // Skarpa kontroller för skarp körning
  // Kör FSD-radgränser och AST-kontroller
  try {
    console.log('Running sharp checks for pathNodePorts...');
    execCaptured('node scripts/drivers/ts.js --check-catch-blocks');
    // Här skulle man kunna lägga till FSD-radgränskontroll om det finns ett dedikerat skript för det, 
    // eller lita på att AST-drivrutinen täcker det.
  } catch (error) {
    console.error('Skarpa kontroller misslyckades i pathNodePorts:', error);
    throw error;
  }

  return {
    avsiktsport: skapaAvsiktsport({ io: deps.io }),
    provningsport: skapaProvningsport({ io: deps.io }),
    konstruktionsport: skapaKonstruktionsport({ io: deps.io }),
    besiktningsport: skapaBesiktningsport({ io: deps.io }),
  };
}
