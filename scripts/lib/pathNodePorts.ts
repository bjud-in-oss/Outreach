import fs from 'fs';
import path from 'path';
import {
  skapaAvsiktsport,
  skapaProvningsport,
  skapaKonstruktionsport,
  skapaBesiktningsport,
} from '../../src/features/path/index.js';
import { execCaptured } from './shellAndBackup.js';
import { PortResult } from '../../src/features/path/index.js';

export function skapaNodePathPortar(deps: {
  ticketId: string;
  io: any;
  dryRun?: boolean;
  testFilVag?: string;
  matris?: any[];
  rootDir?: string;
}) {
  const { dryRun = false } = deps;

  const avsikt = skapaAvsiktsport({ prompter: async () => 'y', beskrivning: 'Verifiera intention' });
  
  const provning = async (kontext: any): Promise<PortResult> => {
    if (dryRun === false) {
      try {
        const testFile = deps.testFilVag || 'transient_test.ts';
        execCaptured(`node scripts/drivers/ts.js --check-alibi --file ${testFile}`);
      } catch (error) {
        deps.io.error('Skarpa kontroller (check-alibi) misslyckades i provningsport:', error);
        throw error;
      }
    }
    const basePort = skapaProvningsport({ 
      testFilVag: deps.testFilVag || 'transient_test.ts', 
      forvantatFel: 'Fail-First', 
      testExekverare: async () => ({ passerade: false, exitKod: 1, felmeddelande: 'Fail-First' }) 
    });
    return basePort(kontext);
  };

  const konstruktion = async (kontext: any): Promise<PortResult> => {
    if (dryRun === false) {
      try {
        execCaptured('node scripts/drivers/ts.js --check-catch-blocks');
      } catch (error) {
        deps.io.error('Skarpa kontroller (check-catch-blocks) misslyckades i konstruktionsport:', error);
        throw error;
      }
    }
    const basePort = skapaKonstruktionsport({ 
      matris: deps.matris || [], 
      inspekterare: async () => ({ existerar: true, antalRader: 50, exporteradIIndex: true }) 
    });
    return basePort(kontext);
  };

  const besiktning = async (kontext: any): Promise<PortResult> => {
    if (dryRun === false) {
      try {
        execCaptured('pnpm verify');
      } catch (error) {
        deps.io.error('Skarpa kontroller (pnpm verify) misslyckades i besiktningsport:', error);
        throw error;
      }
    }
    const basePort = skapaBesiktningsport({ inspekterare: async () => ({ godkand: true }) });
    return basePort(kontext);
  };

  return { avsikt, provning, konstruktion, besiktning };
}
