import { describe, it, expect, vi } from 'vitest';
import { exekveraRunPath } from '../run-path';

describe('exekveraRunPath Integration', () => {
  it('skall köra lean-receptet framgångsrikt som standard', async () => {
    const logMock = vi.fn();
    const io = {
      log: logMock,
      error: vi.fn(),
      warn: vi.fn(),
    };

    const resultat = await exekveraRunPath({
      ticketId: 'TCK-MAINT-024',
      argv: [],
      io
    });

    expect(resultat).toBeDefined();
    expect(resultat.success).toBe(true);
    expect(resultat.slutfold).toBe(true);
  });

  it('skall köra classic-receptet framgångsrikt med --classic flaggan', async () => {
    const logMock = vi.fn();
    const io = {
      log: logMock,
      error: vi.fn(),
      warn: vi.fn(),
    };

    const resultat = await exekveraRunPath({
      ticketId: 'TCK-MAINT-024',
      argv: ['--classic'],
      io
    });

    expect(resultat).toBeDefined();
    expect(resultat.success).toBe(true);
    expect(resultat.slutfold).toBe(true);
  });
});
