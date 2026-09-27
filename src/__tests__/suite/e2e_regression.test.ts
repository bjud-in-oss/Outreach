import { runTransientTCK004Tests } from '../transient_TCK-004.test.ts';
import { runTransientTCK005Tests } from '../transient_TCK-005.test.ts';
import { runTransientTCK006Tests } from '../transient_TCK-006.test.ts';
import { runTransientTCK007Tests } from '../transient_TCK-007.test.ts';
import { runTransientTCK008Tests } from '../transient_TCK-008.test.ts';

export function runE2eRegressionSuite(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  results.push(...runTransientTCK004Tests());
  results.push(...runTransientTCK005Tests());
  results.push(...runTransientTCK006Tests());
  results.push(...runTransientTCK007Tests());
  results.push(...runTransientTCK008Tests());
  return results;
}


