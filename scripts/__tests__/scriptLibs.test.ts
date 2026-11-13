import { describe, it, expect } from 'vitest';
import { getRequiredFiles, buildRetryAnchor } from '../lib/ticketAndAnchor';
import { execFileSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

describe('scriptLibs', () => {
  describe('getRequiredFiles', () => {
    it('should extract required files from ticket prompt', () => {
      const ticketPrompt = `
# TCK-MAINT-049
**Måldomän:** scripts
**Målfiler:** scripts/run-planera-live.ts, scripts/verify-architecture.js
`;
      const files = getRequiredFiles(ticketPrompt, true, 'scripts');
      expect(files).toContain('scripts/run-planera-live.ts');
      expect(files).toContain('scripts/verify-architecture.js');
    });
  });

  describe('buildRetryAnchor', () => {
    it('should build retry anchor without truncation if below maxChars', () => {
      const testContent = 'testContent';
      const currentSourceSummary = 'currentSourceSummary';
      const testLog = 'testLog';
      const anchor = buildRetryAnchor(testContent, currentSourceSummary, testLog, 1000);
      expect(anchor).toContain(testContent);
      expect(anchor).toContain(currentSourceSummary);
      expect(anchor).toContain(testLog);
    });

    it('should truncate currentSourceSummary if exceeds maxChars', () => {
      const testContent = 'testContent';
      const testLog = 'testLog';
      const currentSourceSummary = 'A'.repeat(1000);
      const maxChars = 200;
      
      const anchor = buildRetryAnchor(testContent, currentSourceSummary, testLog, maxChars);
      
      expect(anchor.length).toBeLessThanOrEqual(maxChars + 600);
      expect(anchor).toContain('... [TRUNKERAD PGA TILLÅTEN MAXLÄNGD FÖR KONTEXT] ...');
    });
  });
});
