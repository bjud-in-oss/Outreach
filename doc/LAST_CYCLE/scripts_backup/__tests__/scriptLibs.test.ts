import { describe, it, expect } from 'vitest';
import { getRequiredFiles, buildRetryAnchor, getCompactTicketWindow, validateTicketScope, selectRelevantRetryFiles, extractErrorSignature } from '../lib/ticketAndAnchor';
import os from 'os';
import path from 'path';
import fs from 'fs';

describe('scriptLibs', () => {
  describe('getRequiredFiles', () => {
    it('should extract required files from ticket prompt', () => {
      const ticketPrompt = '# TCK-MAINT-049\n**Måldomän:** scripts\n**Målfiler:** `scripts/run-planera-live.ts`, `scripts/verify-architecture.js`';
      const files = getRequiredFiles(ticketPrompt, true, 'scripts');
      expect(files).toContain('scripts/run-planera-live.ts');
      expect(files).toContain('scripts/verify-architecture.js');
    });
  });

  describe('getCompactTicketWindow', () => {
    it('should return recently verified tickets', () => {
      const ticketsMd = '# Tickets\n- [x] **TCK-1** (VERIFIED)\n- [x] **TCK-2** (VERIFIED)\n- [ ] **TCK-3** (PENDING)';
      const window = getCompactTicketWindow(ticketsMd, 1);
      expect(window).toContain('TCK-2');
      expect(window).not.toContain('TCK-1');
    });
  });

  describe('validateTicketScope', () => {
    it('should return false if more than 4 files are required', () => {
      const ticketPrompt = '# TCK-TEST\n**Målfiler:** `f1.ts`, `f2.ts`, `f3.ts`, `f4.ts`, `f5.ts`';
      const result = validateTicketScope(ticketPrompt, false, 'test');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('För många målfiler angivna');
    });

    it('should return true if 4 or fewer files are required', () => {
      const ticketPrompt = '# TCK-TEST\n**Målfiler:** `f1.ts`';
      const result = validateTicketScope(ticketPrompt, false, 'test');
      expect(result.valid).toBe(true);
    });
  });

  describe('extractErrorSignature', () => {
    it('should extract matching signatures from a 30-line log and filter stack traces', () => {
      const log = [
        '✘ [ERROR] No matching export...',
        'at ModuleJob.runMain (node:internal/modules/esm/worker_loader:112:12)',
        'error TS2322: Type string is not assignable to type number.',
        'at Object.<anonymous> (file:///app/scripts/__tests__/scriptLibs.test.ts:45:15)',
        ...Array(26).fill('some stack trace line')
      ].join('\n');
      
      const signature = extractErrorSignature(log, 5);
      const lines = signature.split('\n');
      
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('✘ [ERROR] No matching export...');
      expect(lines[1]).toBe('error TS2322: Type string is not assignable to type number.');
    });
  });

  describe('selectRelevantRetryFiles', () => {
    it('should select files mentioned in error log', () => {
      const candidates = ['scripts/lib/maintValidation.ts', 'scripts/run-planera-live.ts'];
      const errorLog = 'Error in maintValidation.ts';
      const selected = selectRelevantRetryFiles(candidates, errorLog);
      expect(selected).toContain('scripts/lib/maintValidation.ts');
    });
  });

  describe('buildRetryAnchor', () => {
    it('should build retry anchor without truncation if below maxChars', () => {
      const testContent = 'testContent';
      const currentSourceSummary = 'line 1\nline 2';
      const testLog = 'testLog';
      const anchor = buildRetryAnchor(testContent, currentSourceSummary, testLog, 1000);
      expect(anchor).toContain(testContent);
      expect(anchor).toContain(currentSourceSummary);
      expect(anchor).toContain(testLog);
    });

    it('should preserve header lines and truncate error range', () => {
      const testContent = 'testContent';
      const currentSourceSummary = Array(50).fill('line').map((_, i) => `line ${i+1}`).join('\n');
      const testLog = 'Error at scripts/lib/contextBatcher.ts:10';
      const maxChars = 2000;
      
      const anchor = buildRetryAnchor(testContent, currentSourceSummary, testLog, maxChars);
      
      expect(anchor).toContain('line 1');
      expect(anchor).toContain('line 40');
      expect(anchor).toContain('--- [TRUNKERAT RADINTERVALL');
    });
  });

  describe('validateCodebaseLineLimits', () => {
    it('should return 1 when a 260-raders file violates the limit', () => {
      const tmpDir = os.tmpdir();
      const testFeatureDir = path.join(tmpDir, 'scripts');
      fs.mkdirSync(testFeatureDir, { recursive: true });
      
      const file260 = path.join(testFeatureDir, 'violation.ts');
      const content = Array(260).fill('console.log("test");').join('\n');
      fs.writeFileSync(file260, content, 'utf8');

      try {
        const { validateCodebaseLineLimits } = require('../lib/sizeGate.js');
        const violations = validateCodebaseLineLimits(tmpDir);
        expect(violations).toBe(1);
      } finally {
        if (fs.existsSync(file260)) fs.unlinkSync(file260);
        if (fs.existsSync(testFeatureDir)) fs.rmdirSync(testFeatureDir);
      }
    });
  });
});