import { runTransientTCK004Tests } from '../transient_TCK-004.test.ts';
import { runTransientTCK005Tests } from '../transient_TCK-005.test.ts';
import { runTransientTCK006Tests } from '../transient_TCK-006.test.ts';
import { runTransientTCK007Tests } from '../transient_TCK-007.test.ts';
import { runTransientTCK008Tests } from '../transient_TCK-008.test.ts';
import { runTransientTCK009Tests } from '../transient_TCK-009.test.ts';
import { runTransientTCK003Tests } from '../transient_TCK-003.test.ts';
import { runTransientTCK010Tests } from '../transient_TCK-010.test.ts';
import { runTransientTCK011Tests } from '../transient_TCK-011.test.ts';
import { runTransientTCK002Tests } from '../transient_TCK-002.test.ts';
import { runTransientTCK012Tests } from '../transient_TCK-012.test.ts';

export async function runE2eRegressionSuite(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results = [];
  results.push(...(await runTransientTCK002Tests()));
  results.push(...runTransientTCK004Tests());
  results.push(...runTransientTCK005Tests());
  results.push(...runTransientTCK006Tests());
  results.push(...runTransientTCK007Tests());
  results.push(...runTransientTCK008Tests());
  results.push(...runTransientTCK009Tests());
  results.push(...(await runTransientTCK003Tests()));
  results.push(...(await runTransientTCK010Tests()));
  results.push(...(await runTransientTCK011Tests()));
  results.push(...(await runTransientTCK012Tests()));
  return results;
}
