import { runTransientTCK004Tests } from '../transient_TCK-004.test.ts';

export function runE2eRegressionSuite(): { name: string; passed: boolean; error?: string }[] {
  const results = [];
  results.push(...runTransientTCK004Tests());
  return results;
}
