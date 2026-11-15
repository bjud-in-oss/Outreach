import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  MetaKritikBedomningSchema, 
  MetaKritikResultatSchema,
  PathContextSchema,
  CompiledPromptSchema
} from '../contracts/pathSchema';
import { genereraKonstruktivKritik } from '../engine/metaReflection';

describe('TCK-062 Enhetlig Wayfinder-kritik och 3-vägs triagering', () => {
  
  describe('pathSchema.ts uppgraderingar', () => {
    it('ska inkludera MAKULERAD_INAKTUELL i MetaKritikBedomningSchema', () => {
      const result = MetaKritikBedomningSchema.safeParse('MAKULERAD_INAKTUELL');
      expect(result.success).toBe(true);
    });

    it('ska ha prioritet med defaultvärdet MEDEL i MetaKritikResultatSchema', () => {
      const input = {
        bedomning: 'STOR_SKILLNAD',
        kritikText: 'Test kritik',
        motivering: 'Test motivering'
      };
      const parsed = MetaKritikResultatSchema.parse(input);
      expect(parsed.prioritet).toBe('MEDEL');
    });

    it('ska acceptera explicit prioritet i MetaKritikResultatSchema', () => {
      const input = {
        bedomning: 'LITEM_BATCH',
        kritikText: 'Test kritik',
        motivering: 'Test motivering',
        prioritet: 'HOG'
      };
      const parsed = MetaKritikResultatSchema.parse(input);
      expect(parsed.prioritet).toBe('HOG');
    });

    it('ska kräva två argument för z.record i PathContextSchema och CompiledPromptSchema', () => {
      const ctxResult = PathContextSchema.safeParse({
        biljettDatum: '2026-11-15T21:00:00Z',
        minne: { 'nyckel': 'värde' }
      });
      expect(ctxResult.success).toBe(true);

      const promptResult = CompiledPromptSchema.safeParse({
        variables: { 'var1': 123 }
      });
      expect(promptResult.success).toBe(true);
    });
  });

  describe('genereraKonstruktivKritik', () => {
    it('ska returnera Zod-validerat resultat med prioritet', async () => {
      const mockAdapter = {
        skicka: async () => ({
          svar: {
            bedomning: 'MAKULERAD_INAKTUELL',
            kritikText: 'Inaktuell kod',
            motivering: 'Uppdraget har ändrats',
            prioritet: 'LAG'
          }
        })
      };

      // @ts-ignore - mock adapter för test
      const result = await genereraKonstruktivKritik(mockAdapter, {});
      
      expect(result.bedomning).toBe('MAKULERAD_INAKTUELL');
      expect(result.prioritet).toBe('LAG');
    });
  });
});
