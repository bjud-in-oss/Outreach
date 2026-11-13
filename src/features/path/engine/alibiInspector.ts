export function inspectTestAlibis(testKod: string): { godkand: boolean; felmeddelande?: string } {
  const alibiPatterns = [
    {
      regex: /expect\s*\(\s*true\s*\)\s*\.\s*toBe\s*\(\s*true\s*\)/i,
      message: 'Tautologisk assertion: expect(true).toBe(true)',
    },
    {
      regex: /expect\s*\(\s*false\s*\)\s*\.\s*toBe\s*\(\s*false\s*\)/i,
      message: 'Tautologisk assertion: expect(false).toBe(false)',
    },
    {
      regex: /expect\s*\(\s*true\s*\)\s*\.\s*to.be.true/i,
      message: 'Tautologisk assertion: expect(true).to.be.true',
    },
    {
      regex: /expect\s*\(\s*false\s*\)\s*\.\s*to.be.false/i,
      message: 'Tautologisk assertion: expect(false).to.be.false',
    }
  ];

  for (const pattern of alibiPatterns) {
    if (pattern.regex.test(testKod)) {
      return {
        godkand: false,
        felmeddelande: pattern.message,
      };
    }
  }

  // Ytterligare källkodsmatchning enligt kontraktet
  if (testKod.includes('fs.readFileSync')) {
    return {
      godkand: false,
      felmeddelande: 'Otillåtet anrop: fs.readFileSync i testkod',
    };
  }

  if (testKod.includes('vi.fn(')) {
    return {
      godkand: false,
      felmeddelande: 'Otillåtet anrop: vi.fn() utan körtidsankare',
    };
  }

  return { godkand: true };
}
